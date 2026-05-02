import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { addDays, toISODate } from "@/lib/date";

const SentimentSchema = z.enum(["focused", "steady", "drifting", "depleted", "energized"]);

export const upsertEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        content_md: z.string().max(20000),
        sentiment: SentimentSchema.nullable().optional(),
        key_takeaways: z.string().max(1000).nullable().optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("journal_entries")
      .upsert(
        {
          user_id: userId,
          entry_date: data.entry_date,
          content_md: data.content_md,
          sentiment: data.sentiment ?? null,
          key_takeaways: data.key_takeaways ?? null,
        },
        { onConflict: "user_id,entry_date" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getEntry = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({ entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", userId)
      .eq("entry_date", data.entry_date)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const listEntries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({ days: z.number().int().min(1).max(180).default(60) }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const start = toISODate(addDays(new Date(), -(data.days - 1)));
    const { data: rows, error } = await supabase
      .from("journal_entries")
      .select("entry_date, sentiment, key_takeaways, content_md")
      .eq("user_id", userId)
      .gte("entry_date", start)
      .order("entry_date", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

/**
 * Review bundle: for each recent entry, compute that day's habit completion
 * and a snapshot of active goals' current progress.
 */
export const getReviewBundle = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({ days: z.number().int().min(1).max(60).default(14) }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const start = toISODate(addDays(new Date(), -(data.days - 1)));

    const [
      { data: entries },
      { data: habits },
      { data: logs },
      { data: goals },
    ] = await Promise.all([
      supabase
        .from("journal_entries")
        .select("entry_date, content_md, sentiment, key_takeaways")
        .eq("user_id", userId)
        .gte("entry_date", start)
        .order("entry_date", { ascending: false }),
      supabase
        .from("habits")
        .select("id, name, tier")
        .eq("user_id", userId)
        .is("archived_at", null),
      supabase
        .from("habit_logs")
        .select("habit_id, log_date, completed")
        .eq("user_id", userId)
        .gte("log_date", start),
      supabase
        .from("goals")
        .select(
          "id, title, status, key_results(kind, current_value, target_value, key_result_items(done))",
        )
        .eq("user_id", userId)
        .eq("status", "active"),
    ]);

    const h = habits ?? [];
    const goalsList = (goals ?? []).map((g: any) => {
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
    });

    const logsByDate = new Map<string, Set<string>>();
    for (const l of logs ?? []) {
      if (!l.completed) continue;
      if (!logsByDate.has(l.log_date)) logsByDate.set(l.log_date, new Set());
      logsByDate.get(l.log_date)!.add(l.habit_id);
    }

    const items = (entries ?? []).map((e) => {
      const done = logsByDate.get(e.entry_date) ?? new Set();
      const completed = h.filter((hh) => done.has(hh.id));
      return {
        ...e,
        habits_completed: completed.length,
        habits_total: h.length,
        completed_names: completed.map((c) => c.name),
      };
    });

    return { entries: items, goals: goalsList.slice(0, 3) };
  });
