import { useMemo } from "react";
import { motion } from "framer-motion";
import { LUCID_TWEEN } from "./motion/ease";

/**
 * Dense terminal-style stats strip — Bloomberg-inspired.
 * Tight grid, mono labels, micro-sparklines, deltas.
 * Accepts pulse data; gracefully degrades when missing.
 */
export function DataTerminal({
  trend,
  todayScore,
  delta,
  activeGoals,
  journalStreak,
}: {
  trend: { date: string; score: number; completion?: number }[];
  todayScore: number;
  delta: number;
  activeGoals: number;
  journalStreak: number;
}) {
  const series = trend ?? [];
  const scores = series.map((d) => d.score);
  const completions = series.map((d) => (d.completion ?? 0) * 100);

  const stats = useMemo(
    () => [
      { k: "SCORE", v: todayScore.toString(), d: deltaStr(delta), data: scores, accent: "oklch(0.62 0.16 35)" },
      { k: "TREND", v: avg(scores).toFixed(0), d: dirArrow(scores), data: scores, accent: "oklch(0.62 0.16 35)" },
      { k: "COMPLETION", v: avg(completions).toFixed(0) + "%", d: dirArrow(completions), data: completions, accent: "oklch(0.55 0.14 290)" },
      { k: "OBJECTIVES", v: activeGoals.toString(), d: "·", data: scores, accent: "oklch(0.62 0.14 150)" },
      { k: "STREAK", v: journalStreak.toString() + "d", d: journalStreak > 0 ? "↑" : "·", data: scores, accent: "oklch(0.78 0.14 70)" },
      { k: "VOLATILITY", v: stddev(scores).toFixed(1), d: "σ", data: scores, accent: "oklch(0.50 0.015 260)" },
    ],
    [todayScore, delta, activeGoals, journalStreak, scores, completions],
  );

  return (
    <div className="border border-border bg-card overflow-hidden">
      {/* Ticker header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-hairline bg-graphite/40">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-ash">
            Pulse Terminal · live
          </span>
        </div>
        <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-ash">
          {new Date().toISOString().slice(0, 10)} · {series.length}d window
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-hairline">
        {stats.map((s, i) => (
          <motion.div
            key={s.k}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, ...LUCID_TWEEN }}
            className="bg-card p-3 flex flex-col gap-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-ash">{s.k}</span>
              <span className="font-mono text-[10px]" style={{ color: s.accent }}>
                {s.d}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-2xl leading-none num text-bone">{s.v}</span>
            </div>
            <Sparkline data={s.data} color={s.accent} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return <div className="h-6" />;
  const w = 100;
  const h = 24;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = data.length > 1 ? w / (data.length - 1) : w;
  const points = data
    .map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" L ");
  const path = `M ${points}`;
  const area = `${path} L ${w},${h} L 0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-6" preserveAspectRatio="none">
      <motion.path
        d={area}
        fill={color}
        opacity={0.12}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.12 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      />
      <motion.path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.25}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}

function avg(arr: number[]) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
function stddev(arr: number[]) {
  if (arr.length < 2) return 0;
  const m = avg(arr);
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length);
}
function dirArrow(arr: number[]) {
  if (arr.length < 2) return "·";
  return arr[arr.length - 1] >= arr[0] ? "↑" : "↓";
}
function deltaStr(d: number) {
  if (d === 0) return "·";
  return (d > 0 ? "+" : "") + d.toFixed(0);
}
