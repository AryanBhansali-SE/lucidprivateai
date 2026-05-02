// Server-only Google Calendar helpers.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const CAL_BASE = "https://www.googleapis.com/calendar/v3";

export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
].join(" ");

export function getRedirectUri(origin: string) {
  return `${origin}/api/auth/google/callback`;
}

export function buildAuthUrl(origin: string, state: string) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID!;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(origin),
    response_type: "code",
    scope: GOOGLE_SCOPES,
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCode(origin: string, code: string) {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
    client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
    redirect_uri: getRedirectUri(origin),
    grant_type: "authorization_code",
  });
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope: string;
    id_token?: string;
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
    client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as { access_token: string; expires_in: number; scope: string };
}

function decodeIdTokenEmail(idToken?: string): string | null {
  if (!idToken) return null;
  const parts = idToken.split(".");
  if (parts.length < 2) return null;
  try {
    const json = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"),
    );
    return json.email ?? null;
  } catch {
    return null;
  }
}

export async function saveConnection(userId: string, tokens: Awaited<ReturnType<typeof exchangeCode>>) {
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
  const email = decodeIdTokenEmail(tokens.id_token);
  // Preserve existing refresh_token if Google omits it on re-consent
  let refresh = tokens.refresh_token;
  if (!refresh) {
    const { data: existing } = await supabaseAdmin
      .from("calendar_connections")
      .select("refresh_token")
      .eq("user_id", userId)
      .maybeSingle();
    refresh = existing?.refresh_token;
  }
  if (!refresh) throw new Error("Missing refresh_token from Google. Re-consent required.");

  await supabaseAdmin.from("calendar_connections").upsert(
    {
      user_id: userId,
      provider: "google",
      google_email: email,
      access_token: tokens.access_token,
      refresh_token: refresh,
      expires_at: expiresAt,
      scope: tokens.scope,
    },
    { onConflict: "user_id" },
  );
}

export async function getValidAccessToken(userId: string): Promise<{ token: string; email: string | null } | null> {
  const { data } = await supabaseAdmin
    .from("calendar_connections")
    .select("access_token, refresh_token, expires_at, google_email")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return null;
  const exp = new Date(data.expires_at).getTime();
  if (exp - Date.now() > 60_000) {
    return { token: data.access_token, email: data.google_email };
  }
  const refreshed = await refreshAccessToken(data.refresh_token);
  const newExp = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
  await supabaseAdmin
    .from("calendar_connections")
    .update({ access_token: refreshed.access_token, expires_at: newExp })
    .eq("user_id", userId);
  return { token: refreshed.access_token, email: data.google_email };
}

export async function listUpcomingEvents(userId: string) {
  const auth = await getValidAccessToken(userId);
  if (!auth) return null;
  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const url = `${CAL_BASE}/calendars/primary/events?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&maxResults=50`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${auth.token}` } });
  if (!res.ok) throw new Error(`Calendar list failed: ${res.status}`);
  const json = (await res.json()) as { items: any[] };
  return {
    email: auth.email,
    events: (json.items ?? []).map((e) => ({
      id: e.id as string,
      summary: (e.summary as string) ?? "(no title)",
      start: (e.start?.dateTime ?? e.start?.date) as string,
      end: (e.end?.dateTime ?? e.end?.date) as string,
      htmlLink: e.htmlLink as string,
      allDay: !e.start?.dateTime,
    })),
  };
}

export async function createCalendarEvent(
  userId: string,
  input: { summary: string; description?: string; startISO: string; durationMin: number },
) {
  const auth = await getValidAccessToken(userId);
  if (!auth) throw new Error("Calendar not connected");
  const start = new Date(input.startISO);
  const end = new Date(start.getTime() + input.durationMin * 60_000);
  const res = await fetch(`${CAL_BASE}/calendars/primary/events`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary: input.summary,
      description: input.description,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
    }),
  });
  if (!res.ok) throw new Error(`Create event failed: ${res.status} ${await res.text()}`);
  return await res.json();
}
