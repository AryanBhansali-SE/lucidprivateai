import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeScore, currentStreak, longestStreak } from "@/lib/score";
import { addDays, toISODate } from "@/lib/date";

const TierSchema = z.enum(["keystone", "core", "supporting"]);

export const listHabits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", userId)
      .is("archived_at", null)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createHabit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        name: z.string().min(1).max(80),
        tier: TierSchema,
        break_penalty: z.boolean().default(false),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("habits")
      .insert({
        user_id: userId,
        name: data.name,
        tier: data.tier,
        break_penalty: data.break_penalty,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateHabit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        name: z.string().min(1).max(80).optional(),
        tier: TierSchema.optional(),
        break_penalty: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { id, ...patch } = data;
    const { error } = await supabase
      .from("habits")
      .update(patch)
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const archiveHabit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("habits")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleHabitLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        habit_id: z.string().uuid(),
        log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    // Verify ownership
    const { data: habit } = await supabase
      .from("habits")
      .select("id")
      .eq("id", data.habit_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (!habit) throw new Error("Not found");

    const { data: existing } = await supabase
      .from("habit_logs")
      .select("id, completed")
      .eq("habit_id", data.habit_id)
      .eq("log_date", data.log_date)
      .maybeSingle();

    if (existing) {
      if (existing.completed) {
        const { error } = await supabase.from("habit_logs").delete().eq("id", existing.id);
        if (error) throw new Error(error.message);
        return { completed: false };
      } else {
        const { error } = await supabase
          .from("habit_logs")
          .update({ completed: true })
          .eq("id", existing.id);
        if (error) throw new Error(error.message);
        return { completed: true };
      }
    } else {
      const { error } = await supabase.from("habit_logs").insert({
        user_id: userId,
        habit_id: data.habit_id,
        log_date: data.log_date,
        completed: true,
      });
      if (error) throw new Error(error.message);
      return { completed: true };
    }
  });

export const getMatrix = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ days: z.number().int().min(7).max(180).default(60) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const today = new Date();
    const start = toISODate(addDays(today, -(data.days - 1)));
    const end = toISODate(today);

    const [{ data: habits }, { data: logs }] = await Promise.all([
      supabase
        .from("habits")
        .select("*")
        .eq("user_id", userId)
        .is("archived_at", null)
        .order("sort_order")
        .order("created_at"),
      supabase
        .from("habit_logs")
        .select("habit_id, log_date, completed")
        .eq("user_id", userId)
        .gte("log_date", start)
        .lte("log_date", end),
    ]);

    return {
      start,
      end,
      days: data.days,
      habits: habits ?? [],
      logs: logs ?? [],
    };
  });

export const getScoreBundle = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const today = new Date();
    const start = toISODate(addDays(today, -29));
    const end = toISODate(today);

    const [{ data: habits }, { data: logs }] = await Promise.all([
      supabase
        .from("habits")
        .select("id, tier, break_penalty, name")
        .eq("user_id", userId)
        .is("archived_at", null),
      supabase
        .from("habit_logs")
        .select("habit_id, log_date, completed")
        .eq("user_id", userId)
        .gte("log_date", start)
        .lte("log_date", end),
    ]);

    const h = (habits ?? []) as Array<{
      id: string;
      tier: "keystone" | "core" | "supporting";
      break_penalty: boolean;
      name: string;
    }>;
    const l = (logs ?? []) as Array<{ habit_id: string; log_date: string; completed: boolean }>;

    const score = computeScore(h, l, today);

    // Per-tier breakdown
    const tierBreakdown = (["keystone", "core", "supporting"] as const).map((t) => {
      const subset = h.filter((x) => x.tier === t);
      return {
        tier: t,
        count: subset.length,
        score: subset.length ? computeScore(subset, l, today) : 0,
      };
    });

    // Streaks per habit
    const streaks = h.map((habit) => ({
      habit_id: habit.id,
      name: habit.name,
      current: currentStreak(l, habit.id, today),
      longest: longestStreak(l, habit.id),
    }));

    return { score, tierBreakdown, streaks };
  });

export const getTodayHabits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const today = toISODate(new Date());

    const [{ data: habits }, { data: logs }] = await Promise.all([
      supabase
        .from("habits")
        .select("id, name, tier")
        .eq("user_id", userId)
        .is("archived_at", null)
        .order("sort_order")
        .order("created_at"),
      supabase
        .from("habit_logs")
        .select("habit_id, completed")
        .eq("user_id", userId)
        .eq("log_date", today),
    ]);

    const done = new Set((logs ?? []).filter((l) => l.completed).map((l) => l.habit_id));
    return {
      date: today,
      habits: (habits ?? []).map((h) => ({ ...h, completed: done.has(h.id) })),
    };
  });
