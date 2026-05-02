import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

function getClient(token?: string) {
  const url = process.env.VITE_SUPABASE_URL!;
  const anon = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
  return createClient(url, anon, {
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : {},
    auth: { persistSession: false },
  });
}

export const getOnboarding = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => (d ?? {}) as { token?: string })
  .handler(async ({ data }) => {
    const supabase = getClient(data.token);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return { intro_seen: true, tutorial_dismissed: [] as string[] };
    const { data: row } = await supabase
      .from("profiles")
      .select("intro_seen, tutorial_dismissed")
      .eq("id", u.user.id)
      .maybeSingle();
    return {
      intro_seen: row?.intro_seen ?? false,
      tutorial_dismissed: (row?.tutorial_dismissed as string[]) ?? [],
    };
  });

export const markIntroSeen = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => (d ?? {}) as { token?: string })
  .handler(async ({ data }) => {
    const supabase = getClient(data.token);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return { ok: false };
    await supabase.from("profiles").upsert({ id: u.user.id, intro_seen: true });
    return { ok: true };
  });

export const dismissTutorial = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as { key: string; token?: string })
  .handler(async ({ data }) => {
    const supabase = getClient(data.token);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return { ok: false };
    const { data: row } = await supabase
      .from("profiles")
      .select("tutorial_dismissed")
      .eq("id", u.user.id)
      .maybeSingle();
    const list = new Set<string>((row?.tutorial_dismissed as string[]) ?? []);
    list.add(data.key);
    await supabase
      .from("profiles")
      .upsert({ id: u.user.id, tutorial_dismissed: Array.from(list) });
    return { ok: true };
  });
