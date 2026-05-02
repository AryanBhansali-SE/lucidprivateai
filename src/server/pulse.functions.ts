import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { addDays, toISODate } from "@/lib/date";
import { computeScore } from "@/lib/score";

export const getPulse = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({ days: z.number().int().min(7).max(30).default(7) }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const today = new Date();
    const start = toISODate(addDays(today, -(data.days + 29))); // need 30d window before each point
    const trendStart = toISODate(addDays(today, -(data.days - 1)));

    const [
      { data: habits },
      { data: logs },
      { data: goals },
      { data: lastJournal },
    ] = await Promise.all([
      supabase
        .from("habits")
        .select("id, tier, break_penalty")
        .eq("user_id", userId)
        .is("archived_at", null),
      supabase
        .from("habit_logs")
        .select("habit_id, log_date, completed")
        .eq("user_id", userId)
        .gte("log_date", start),
      supabase
        .from("goals")
        .select("id, title, status, key_results(kind, current_value, target_value, key_result_items(done))")
        .eq("user_id", userId)
        .eq("status", "active"),
      supabase
        .from("journal_entries")
        .select("entry_date, sentiment, content_md")
        .eq("user_id", userId)
        .order("entry_date", { ascending: false })
        .limit(1),
    ]);

    const h = (habits ?? []) as Array<{
      id: string;
      tier: "keystone" | "core" | "supporting";
      break_penalty: boolean;
    }>;
    const l = (logs ?? []) as Array<{ habit_id: string; log_date: string; completed: boolean }>;

    // Trend: consistency score per day for the last `days` days
    const trend: Array<{ date: string; score: number; completion: number }> = [];
    for (let i = data.days - 1; i >= 0; i--) {
      const d = addDays(today, -i);
      const iso = toISODate(d);
      const score = computeScore(h, l, d);
      // completion rate that specific day
      const dayLogs = l.filter((x) => x.log_date === iso && x.completed);
      const completion = h.length === 0 ? 0 : Math.round((dayLogs.length / h.length) * 100);
      trend.push({ date: iso, score, completion });
    }

    // Goals snapshot
    const goalRings = (goals ?? [])
      .map((g: any) => {
        const krs = g.key_results ?? [];
        const progress =
          krs.length === 0
            ? 0
            : krs.reduce((acc: number, kr: any) => {
                if (kr.kind === "numeric") {
                  if (!kr.target_value) return acc;
                  return acc + Math.min(1, (kr.current_value ?? 0) / kr.target_value);
                }
                const items = kr.key_result_items ?? [];
                if (items.length === 0) return acc;
                return acc + items.filter((i: any) => i.done).length / items.length;
              }, 0) / krs.length;
        return { id: g.id, title: g.title, progress };
      })
      .slice(0, 4);

    const todayScore = trend[trend.length - 1]?.score ?? 0;
    const prevScore = trend[0]?.score ?? 0;
    const delta = todayScore - prevScore;

    // Journal streak — consecutive days ending today with an entry
    const { data: recentJournal } = await supabase
      .from("journal_entries")
      .select("entry_date")
      .eq("user_id", userId)
      .gte("entry_date", toISODate(addDays(today, -60)))
      .order("entry_date", { ascending: false });
    const dates = new Set((recentJournal ?? []).map((r) => r.entry_date));
    let journalStreak = 0;
    for (let i = 0; i < 60; i++) {
      const d = toISODate(addDays(today, -i));
      if (dates.has(d)) journalStreak++;
      else break;
    }

    return {
      todayScore,
      delta,
      activeGoals: goalRings.length,
      journalStreak,
      trend,
      goalRings,
      lastJournal: lastJournal?.[0] ?? null,
    };
  });
