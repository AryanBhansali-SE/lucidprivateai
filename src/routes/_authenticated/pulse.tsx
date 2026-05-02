import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Panel, Stat, KPIBar } from "@/components/lucid/Panel";
import { RadialScore } from "@/components/lucid/RadialScore";
import { useAuthedServerFn } from "@/lib/use-authed-server-fn";
import { getPulse } from "@/server/pulse.functions";
import { getTodayHabits, toggleHabitLog } from "@/server/habits.functions";
import { formatShort, todayISO } from "@/lib/date";
import { Check, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

export const Route = createFileRoute("/_authenticated/pulse")({
  head: () => ({
    meta: [
      { title: "Pulse — Lucid" },
      { name: "description", content: "7-day performance pulse: habits, objectives, journal." },
    ],
  }),
  component: PulsePage,
});

function PulsePage() {
  const fetchPulse = useAuthedServerFn(getPulse);
  const fetchToday = useAuthedServerFn(getTodayHabits);
  const toggle = useAuthedServerFn(toggleHabitLog);
  const [pulse, setPulse] = useState<any>(null);
  const [today, setToday] = useState<any>(null);

  const reload = useCallback(async () => {
    const [p, t] = await Promise.all([
      fetchPulse({ data: { days: 7 } }),
      fetchToday(),
    ]);
    setPulse(p);
    setToday(t);
  }, [fetchPulse, fetchToday]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!pulse || !today) return <PulseSkeleton />;

  const deltaIcon =
    pulse.delta > 0 ? ArrowUpRight : pulse.delta < 0 ? ArrowDownRight : Minus;
  const DeltaIcon = deltaIcon;

  return (
    <div className="space-y-6">
      {/* Top strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-hairline border border-hairline">
        <div className="bg-card p-5 md:p-6">
          <Stat label="Consistency Score" value={pulse.todayScore} positive />
        </div>
        <div className="bg-card p-5 md:p-6">
          <div className="label-cap mb-1.5">7-Day Delta</div>
          <div className="flex items-baseline gap-1.5">
            <DeltaIcon
              className={cn(
                "h-5 w-5",
                pulse.delta > 0 && "text-gold",
                pulse.delta < 0 && "text-destructive",
                pulse.delta === 0 && "text-ash",
              )}
              strokeWidth={1.25}
            />
            <span className="font-serif text-[34px] leading-none text-bone num">
              {pulse.delta > 0 ? "+" : ""}
              {pulse.delta}
            </span>
          </div>
        </div>
        <div className="bg-card p-5 md:p-6">
          <Stat label="Active Objectives" value={pulse.activeGoals} />
        </div>
        <div className="bg-card p-5 md:p-6">
          <Stat label="Journal Streak" value={pulse.journalStreak} unit="d" />
        </div>
      </div>

      {/* Trend chart */}
      <Panel title="Performance Trend" eyebrow="Last 7 days · Score vs Daily Completion">
        <div className="h-[280px] -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={pulse.trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="date"
                tickFormatter={formatShort}
                tick={{ fill: "var(--color-ash)", fontSize: 10, fontFamily: "var(--font-mono)" }}
                axisLine={{ stroke: "var(--color-hairline)" }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "var(--color-ash)", fontSize: 10, fontFamily: "var(--font-mono)" }}
                axisLine={{ stroke: "var(--color-hairline)" }}
                tickLine={false}
                width={28}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-charcoal)",
                  border: "1px solid var(--color-hairline)",
                  borderRadius: 2,
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                }}
                labelFormatter={(v) => formatShort(v as string)}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="var(--color-gold)"
                strokeWidth={1.5}
                dot={{ fill: "var(--color-gold)", r: 2 }}
                activeDot={{ r: 4 }}
                name="Score"
              />
              <Line
                type="monotone"
                dataKey="completion"
                stroke="var(--color-ash)"
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
                name="Completion"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today */}
        <Panel
          title="Today"
          eyebrow={todayISO()}
          action={
            <Link to="/matrix" className="label-cap hover:text-bone">
              Matrix →
            </Link>
          }
        >
          {today.habits.length === 0 ? (
            <div className="py-8 text-center">
              <div className="label-cap mb-3">No habits defined</div>
              <Link
                to="/settings"
                className="text-gold text-sm font-mono hover:underline"
              >
                Define your first habit →
              </Link>
            </div>
          ) : (
            <ul className="space-y-px">
              {today.habits.map((h: any) => (
                <li key={h.id}>
                  <button
                    onClick={async () => {
                      await toggle({ data: { habit_id: h.id, log_date: todayISO() } });
                      reload();
                    }}
                    className="w-full flex items-center gap-3 px-2 py-2.5 hover:bg-graphite/40 transition-colors group"
                  >
                    <div
                      className={cn(
                        "h-4 w-4 border shrink-0 grid place-items-center transition-colors",
                        h.completed
                          ? "bg-gold border-gold"
                          : "border-hairline group-hover:border-ash",
                      )}
                    >
                      {h.completed && (
                        <Check className="h-3 w-3 text-obsidian" strokeWidth={2.5} />
                      )}
                    </div>
                    <span
                      className={cn(
                        "flex-1 text-left text-sm",
                        h.completed ? "text-ash line-through" : "text-bone",
                      )}
                    >
                      {h.name}
                    </span>
                    <span className="label-cap">{h.tier}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Goal rings */}
        <Panel
          title="Active Objectives"
          eyebrow="Top 4 by recency"
          action={
            <Link to="/goals" className="label-cap hover:text-bone">
              All →
            </Link>
          }
        >
          {pulse.goalRings.length === 0 ? (
            <div className="py-8 text-center">
              <div className="label-cap mb-3">No active objectives</div>
              <Link to="/goals" className="text-gold text-sm font-mono hover:underline">
                Define an objective →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
              {pulse.goalRings.map((g: any) => (
                <div key={g.id} className="flex flex-col items-center text-center">
                  <RadialScore value={g.progress * 100} size={88} stroke={2} />
                  <div className="mt-3 text-xs text-bone font-medium line-clamp-2 max-w-[140px]">
                    {g.title}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* Last journal */}
      {pulse.lastJournal && (
        <Panel
          title="Last Entry"
          eyebrow={`Journal · ${pulse.lastJournal.entry_date}`}
          action={
            <Link to="/journal" className="label-cap hover:text-bone">
              Open →
            </Link>
          }
        >
          <div className="space-y-3">
            {pulse.lastJournal.sentiment && (
              <div className="inline-block">
                <span className="label-cap border-b border-gold pb-0.5">
                  {pulse.lastJournal.sentiment}
                </span>
              </div>
            )}
            <p className="text-bone text-sm leading-relaxed line-clamp-4 whitespace-pre-wrap">
              {pulse.lastJournal.content_md || "—"}
            </p>
          </div>
        </Panel>
      )}
    </div>
  );
}

function PulseSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-24 bg-card border border-border" />
      <div className="h-[320px] bg-card border border-border" />
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="h-64 bg-card border border-border" />
        <div className="h-64 bg-card border border-border" />
      </div>
    </div>
  );
}
