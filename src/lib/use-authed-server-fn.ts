import { useServerFn as useTanServerFn } from "@tanstack/react-start";
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Wraps useServerFn to inject the current Supabase access token as a
 * Bearer Authorization header. Server functions guarded by `requireSupabaseAuth`
 * need this since their middleware reads the request's authorization header.
 */
export function useAuthedServerFn<
  TFn extends (opts?: { data?: any; headers?: HeadersInit }) => Promise<any>,
>(fn: TFn) {
  const wrapped = useTanServerFn(fn);
  return useCallback(
    async (input?: { data?: any; headers?: HeadersInit }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const headers = new Headers(input?.headers);
      if (token) headers.set("authorization", `Bearer ${token}`);
      return (wrapped as any)({
        ...(input ?? {}),
        headers,
      });
    },
    [wrapped],
  ) as TFn;
}
