import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Table = "habit_logs" | "goals" | "key_results" | "journal_entries";

/**
 * Subscribes to a Supabase table and bumps a "tick" counter on every
 * realtime change. Components can use the tick value to trigger a
 * subtle gold flash or count-up re-run.
 */
export function useRealtimeFlash(tables: Table[], onChange?: () => void) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const channels = tables.map((t) =>
      supabase
        .channel(`flash:${t}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: t },
          () => {
            setTick((n) => n + 1);
            onChange?.();
          },
        )
        .subscribe(),
    );
    return () => {
      channels.forEach((c) => supabase.removeChannel(c));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tables.join(",")]);

  return tick;
}
