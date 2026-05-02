import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { exchangeCode, saveConnection } from "@/server/calendar.server";

export const Route = createFileRoute("/api/auth/google/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const error = url.searchParams.get("error");
        const origin = `${url.protocol}//${url.host}`;

        if (error) {
          return Response.redirect(`${origin}/calendar?error=${encodeURIComponent(error)}`, 302);
        }
        if (!code || !state) {
          return Response.redirect(`${origin}/calendar?error=missing_code`, 302);
        }

        const { data: stateRow } = await supabaseAdmin
          .from("oauth_states")
          .select("user_id")
          .eq("state", state)
          .maybeSingle();

        if (!stateRow) {
          return Response.redirect(`${origin}/calendar?error=invalid_state`, 302);
        }

        try {
          const tokens = await exchangeCode(origin, code);
          await saveConnection(stateRow.user_id, tokens);
          await supabaseAdmin.from("oauth_states").delete().eq("state", state);
          return Response.redirect(`${origin}/calendar?connected=1`, 302);
        } catch (e) {
          console.error("Google OAuth callback error:", e);
          return Response.redirect(`${origin}/calendar?error=exchange_failed`, 302);
        }
      },
    },
  },
});
