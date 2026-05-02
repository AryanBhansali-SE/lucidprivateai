import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequestHeader } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  buildAuthUrl,
  createCalendarEvent,
  listUpcomingEvents,
} from "./calendar.server";

function getOrigin(): string {
  const explicit = process.env.PUBLIC_APP_ORIGIN;
  if (explicit) return explicit.replace(/\/$/, "");
  const host = getRequestHeader("x-forwarded-host") ?? getRequestHeader("host");
  const proto = getRequestHeader("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return "http://localhost:8080";
}

export const beginGoogleCalendarOAuth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const state = crypto.randomUUID() + "." + crypto.randomUUID();
    await supabaseAdmin.from("oauth_states").insert({
      state,
      user_id: userId,
      provider: "google",
    });
    // Best-effort cleanup of stale states (>1h)
    await supabaseAdmin
      .from("oauth_states")
      .delete()
      .lt("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());
    return { url: buildAuthUrl(getOrigin(), state) };
  });

export const getCalendarStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data } = await supabaseAdmin
      .from("calendar_connections")
      .select("google_email, created_at")
      .eq("user_id", userId)
      .maybeSingle();
    return {
      connected: !!data,
      email: data?.google_email ?? null,
      connectedAt: data?.created_at ?? null,
    };
  });

export const getCalendarEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const result = await listUpcomingEvents(context.userId);
    if (!result) return { connected: false, events: [], email: null };
    return { connected: true, ...result };
  });

export const scheduleCalendarEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        summary: z.string().min(1).max(200),
        description: z.string().max(2000).optional(),
        startISO: z.string().min(1),
        durationMin: z.number().min(5).max(8 * 60),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const ev = await createCalendarEvent(context.userId, data);
    return { ok: true, id: ev.id, htmlLink: ev.htmlLink };
  });

export const disconnectCalendar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await supabaseAdmin
      .from("calendar_connections")
      .delete()
      .eq("user_id", context.userId);
    return { ok: true };
  });
