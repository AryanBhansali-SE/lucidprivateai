import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface GoalProgress {
  goal_id: string;
  progress: number; // 0..1
  kr_count: number;
}

function krProgress(kr: {
  kind: "numeric" | "checklist";
  current_value: number | null;
  target_value: number | null;
  items?: Array<{ done: boolean }>;
}): number {
  if (kr.kind === "numeric") {
    if (!kr.target_value || kr.target_value <= 0) return 0;
    return Math.max(0, Math.min(1, (kr.current_value ?? 0) / kr.target_value));
  }
  const items = kr.items ?? [];
  if (items.length === 0) return 0;
  const done = items.filter((i) => i.done).length;
  return done / items.length;
}

export const listGoals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: goals, error } = await supabase
      .from("goals")
      .select("*, key_results(id, kind, current_value, target_value, key_result_items(done))")
      .eq("user_id", userId)
      .order("status")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    return (goals ?? []).map((g: any) => {
      const krs = g.key_results ?? [];
      const progress =
        krs.length === 0
          ? 0
          : krs.reduce(
              (acc: number, kr: any) =>
                acc +
                krProgress({
                  kind: kr.kind,
                  current_value: kr.current_value,
                  target_value: kr.target_value,
                  items: kr.key_result_items,
                }),
              0,
            ) / krs.length;
      return {
        id: g.id,
        title: g.title,
        description: g.description,
        target_date: g.target_date,
        status: g.status,
        kr_count: krs.length,
        progress,
      };
    });
  });

export const getGoal = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: goal, error } = await supabase
      .from("goals")
      .select(
        "*, key_results(id, title, kind, target_value, current_value, unit, sort_order, key_result_items(id, label, done, sort_order))",
      )
      .eq("id", data.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!goal) throw new Error("Not found");

    const krs = ((goal as any).key_results ?? []).slice().sort(
      (a: any, b: any) => a.sort_order - b.sort_order,
    );
    for (const kr of krs) {
      kr.key_result_items = (kr.key_result_items ?? []).slice().sort(
        (a: any, b: any) => a.sort_order - b.sort_order,
      );
    }
    return { ...goal, key_results: krs };
  });

export const createGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        title: z.string().min(1).max(120),
        description: z.string().max(500).optional(),
        target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("goals")
      .insert({ user_id: userId, ...data })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        id: z.string().uuid(),
        title: z.string().min(1).max(120).optional(),
        description: z.string().max(500).nullable().optional(),
        target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
        status: z.enum(["active", "paused", "achieved", "archived"]).optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { id, ...patch } = data;
    const { error } = await supabase
      .from("goals")
      .update(patch)
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("goals")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createKeyResult = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        goal_id: z.string().uuid(),
        title: z.string().min(1).max(120),
        kind: z.enum(["numeric", "checklist"]),
        target_value: z.number().optional(),
        unit: z.string().max(20).optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    // verify ownership
    const { data: g } = await supabase
      .from("goals")
      .select("id")
      .eq("id", data.goal_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (!g) throw new Error("Not found");

    const { data: row, error } = await supabase
      .from("key_results")
      .insert({
        goal_id: data.goal_id,
        title: data.title,
        kind: data.kind,
        target_value: data.kind === "numeric" ? data.target_value ?? 100 : null,
        current_value: 0,
        unit: data.unit ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateNumericKR = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        id: z.string().uuid(),
        current_value: z.number().optional(),
        target_value: z.number().optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { id, ...patch } = data;
    const { error } = await supabase.from("key_results").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteKeyResult = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { error } = await supabase.from("key_results").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addChecklistItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        key_result_id: z.string().uuid(),
        label: z.string().min(1).max(120),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase
      .from("key_result_items")
      .insert({ key_result_id: data.key_result_id, label: data.label })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const toggleChecklistItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({ id: z.string().uuid(), done: z.boolean() }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("key_result_items")
      .update({ done: data.done })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteChecklistItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { error } = await supabase.from("key_result_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
