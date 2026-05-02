import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Panel } from "@/components/lucid/Panel";
import { RadialScore } from "@/components/lucid/RadialScore";
import { MagneticCell } from "@/components/lucid/motion/MagneticCell";
import { CountUp } from "@/components/lucid/motion/CountUp";
import { StaggerReveal, RevealItem } from "@/components/lucid/motion/StaggerReveal";
import { useRealtimeFlash } from "@/lib/use-realtime-flash";
import { useAuthedServerFn } from "@/lib/use-authed-server-fn";
import { getMatrix, getScoreBundle, toggleHabitLog, createHabit } from "@/server/habits.functions";
import { addDays, toISODate, todayISO } from "@/lib/date";
import { cn } from "@/lib/utils";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/matrix")({
  head: () => ({
    meta: [
      { title: "Habit Matrix — Lucid" },
      { name: "description", content: "High-density habit completion matrix with consistency scoring." },
    ],
  }),
  component: MatrixPage,
});

const TIER_OPACITY: Record<string, number> = { keystone: 1, core: 0.75, supporting: 0.5 };

function MatrixPage() {
  const fetchMatrix = useAuthedServerFn(getMatrix);
  const fetchScore = useAuthedServerFn(getScoreBundle);
  const toggle = useAuthedServerFn(toggleHabitLog);
  const create = useAuthedServerFn(createHabit);

  const [data, setData] = useState<any>(null);
  const [score, setScore] = useState<any>(null);
  const [adding, setAdding] = useState(false);

  const reload = useCallback(async () => {
    const [m, s] = await Promise.all([fetchMatrix({ data: { days: 60 } }), fetchScore()]);
    setData(m);
    setScore(s);
  }, [fetchMatrix, fetchScore]);

  useEffect(() => {
    reload();
  }, [reload]);

  const tick = useRealtimeFlash(["habit_logs"], reload);

  const days = useMemo(() => {
    if (!data) return [];
    const arr: string[] = [];
    for (let i = data.days - 1; i >= 0; i--) arr.push(toISODate(addDays(new Date(), -i)));
    return arr;
  }, [data]);

  const lookup = useMemo(() => {
    const map = new Map<string, boolean>();
    if (!data) return map;
    for (const l of data.logs) if (l.completed) map.set(`${l.habit_id}|${l.log_date}`, true);
    return map;
  }, [data]);

  if (!data || !score) return <div className="h-96 bg-card border border-border animate-pulse" />;

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <Panel
          title="Habit Matrix"
          eyebrow={`Last ${data.days} days · click a cell to toggle`}
          action={
            <button
              onClick={() => setAdding(true)}
              className="label-cap hover:text-gold flex items-center gap-1"
            >
              <Plus className="h-3 w-3" strokeWidth={1.5} /> Habit
            </button>
          }
          bodyClassName="p-0"
        >
          {data.habits.length === 0 ? (
            <div className="p-12 text-center">
              <div className="label-cap mb-3">No habits defined</div>
              <button
                onClick={() => setAdding(true)}
                className="text-gold text-sm font-mono hover:underline"
              >
                + Define your first habit
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="border-separate border-spacing-0">
                <tbody>
                  {data.habits.map((h: any) => (
                    <tr key={h.id}>
                      <td className="sticky left-0 bg-card px-4 py-1.5 border-r border-border min-w-[160px]">
                        <div className="text-sm text-bone">{h.name}</div>
                        <div className="label-cap">{h.tier}</div>
                      </td>
                      {days.map((d) => {
                        const done = lookup.get(`${h.id}|${d}`);
                        return (
                          <td key={d} className="p-[1px]">
                            <MagneticCell
                              filled={!!done}
                              opacity={TIER_OPACITY[h.tier] ?? 1}
                              title={`${d} · ${done ? "completed" : "—"}`}
                              onClick={() => {
                                toggle({ data: { habit_id: h.id, log_date: d } });
                              }}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="Consistency" eyebrow="30-day weighted">
            <div className="flex flex-col items-center">
              <RadialScore value={score.score} size={140} stroke={2} label="Score" />
              <CountUp
                to={score.score}
                trigger={`m-${tick}`}
                className="mt-2 font-mono text-[11px] text-ash tabular tracking-widest uppercase"
                format={(n) => `${Math.round(n)}/100 weighted`}
              />
            </div>
            <div className="mt-6 space-y-3">
              {score.tierBreakdown.map((t: any) => (
                <div key={t.tier} className="flex items-baseline justify-between">
                  <div>
                    <div className="text-sm text-bone capitalize">{t.tier}</div>
                    <div className="label-cap">{t.count} habit{t.count !== 1 && "s"}</div>
                  </div>
                  <div className="font-mono text-bone tabular text-sm">
                    {t.count > 0 ? `${t.score}%` : "—"}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Streaks" eyebrow="Current · Longest">
            {score.streaks.length === 0 ? (
              <div className="label-cap text-center py-4">No data</div>
            ) : (
              <ul className="space-y-2.5">
                {score.streaks.map((s: any) => (
                  <li key={s.habit_id} className="flex items-baseline justify-between gap-3">
                    <span className="text-sm text-bone truncate">{s.name}</span>
                    <span className="font-mono text-xs text-ash tabular shrink-0">
                      <span className="text-gold">{s.current}d</span>
                      <span className="mx-1 text-hairline">/</span>
                      {s.longest}d
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      {adding && (
        <AddHabitSheet
          onClose={() => setAdding(false)}
          onSubmit={async (payload) => {
            try {
              await create({ data: payload });
              toast.success("Habit added");
              setAdding(false);
              reload();
            } catch (e: any) {
              toast.error(e?.message ?? "Failed");
            }
          }}
        />
      )}
    </div>
  );
}

function AddHabitSheet({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (p: { name: string; tier: "keystone" | "core" | "supporting"; break_penalty: boolean }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [tier, setTier] = useState<"keystone" | "core" | "supporting">("core");
  const [bp, setBp] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6 bg-black/60">
      <div className="w-full max-w-md bg-card border border-border rounded-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <div className="label-cap mb-1">New entry</div>
            <h3 className="font-serif text-bone text-xl">Define a habit</h3>
          </div>
          <button onClick={onClose} className="text-ash hover:text-bone">
            <X className="h-4 w-4" strokeWidth={1.25} />
          </button>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!name.trim()) return;
            await onSubmit({ name: name.trim(), tier, break_penalty: bp });
          }}
          className="p-5 space-y-5"
        >
          <div className="space-y-1.5">
            <label className="label-cap">Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent border-0 border-b border-hairline focus:border-gold outline-none py-2 text-bone text-sm font-mono"
              placeholder="Deep work · 90 minutes"
            />
          </div>

          <div className="space-y-2">
            <label className="label-cap">Importance</label>
            <div className="grid grid-cols-3 gap-px bg-hairline border border-hairline">
              {(["keystone", "core", "supporting"] as const).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTier(t)}
                  className={cn(
                    "py-2.5 text-xs font-mono uppercase tracking-wider transition-colors",
                    tier === t
                      ? "bg-gold text-obsidian"
                      : "bg-card text-ash hover:text-bone",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="label-cap">
              {tier === "keystone" && "Highest weight (×3) in consistency"}
              {tier === "core" && "Standard weight (×2)"}
              {tier === "supporting" && "Light weight (×1)"}
            </div>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={bp}
              onChange={(e) => setBp(e.target.checked)}
              className="mt-1 accent-gold"
            />
            <div>
              <div className="text-sm text-bone">Penalize broken streaks</div>
              <div className="label-cap mt-0.5">
                A missed day after a 5-day streak reduces this habit's score by 15%
              </div>
            </div>
          </label>

          <button
            type="submit"
            className="w-full brushed-gold text-obsidian font-mono uppercase text-xs tracking-[0.2em] py-3 hover:opacity-90 transition-opacity"
          >
            Commit
          </button>
        </form>
      </div>
    </div>
  );
}
