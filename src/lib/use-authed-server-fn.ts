import { useServerFn as useTanServerFn } from "@tanstack/react-start";
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Wraps useServerFn to inject the current Supabase access token as a
 * Bearer header. Server functions guarded by `requireSupabaseAuth` need this.
 */
export function useAuthedServerFn<TFn extends (...args: any[]) => any>(fn: TFn): TFn {
  const wrapped = useTanServerFn(fn);
  return useCallback(
    (async (input?: any) => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const args = input ?? {};
      return wrapped({
        ...args,
        headers: {
          ...(args.headers ?? {}),
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
      });
    }) as unknown as TFn,
    [wrapped],
  );
}
