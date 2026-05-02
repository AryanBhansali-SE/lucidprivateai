import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getOnboarding = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: row } = await supabase
      .from("profiles")
      .select("intro_seen, tutorial_dismissed")
      .eq("id", userId)
      .maybeSingle();
    return {
      intro_seen: row?.intro_seen ?? false,
      tutorial_dismissed: ((row?.tutorial_dismissed as string[] | null) ?? []) as string[],
    };
  });

export const markIntroSeen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await supabase.from("profiles").upsert({ id: userId, intro_seen: true });
    return { ok: true };
  });

export const dismissTutorial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ key: z.string().min(1).max(64) }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: row } = await supabase
      .from("profiles")
      .select("tutorial_dismissed")
      .eq("id", userId)
      .maybeSingle();
    const list = new Set<string>(((row?.tutorial_dismissed as string[] | null) ?? []) as string[]);
    list.add(data.key);
    await supabase
      .from("profiles")
      .upsert({ id: userId, tutorial_dismissed: Array.from(list) });
    return { ok: true };
  });
