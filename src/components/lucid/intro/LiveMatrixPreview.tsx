import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { LUCID_TWEEN } from "@/components/lucid/motion/ease";

/**
 * A "living" matrix preview — animated grid of habit cells that fill in
 * sequentially, simulating what a real week of tracking looks like.
 * Pure presentation, no real data.
 */
const HABITS = ["Read", "Train", "Write", "Sleep ≥7h", "No phone AM", "Walk"];
const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

// Deterministic "completion" pattern so it doesn't reshuffle each render
const PATTERN: number[][] = [
  [1, 1, 1, 0, 1, 1, 1],
  [1, 1, 0, 1, 1, 1, 0],
  [0, 1, 1, 1, 1, 0, 1],
  [1, 1, 1, 1, 0, 1, 1],
  [1, 0, 1, 1, 1, 1, 1],
  [1, 1, 1, 0, 1, 1, 0],
];

export function LiveMatrixPreview() {
  const [pulse, setPulse] = useState(0);

  // Periodically re-trigger the fill animation so the preview feels alive
  useEffect(() => {
    const id = setInterval(() => setPulse((p) => p + 1), 9000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ ...LUCID_TWEEN, duration: 0.9 }}
      className="relative w-full max-w-xl mx-auto bg-[oklch(0.95_0.010_75)] border border-[oklch(0.80_0.014_75)] shadow-[0_30px_80px_-30px_oklch(0.22_0.018_265_/_0.25)]"
    >
      {/* Window chrome */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[oklch(0.85_0.012_75)] bg-[oklch(0.93_0.011_75)]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[oklch(0.62_0.16_35)]" />
          <span className="w-2 h-2 rounded-full bg-[oklch(0.78_0.12_60)]" />
          <span className="w-2 h-2 rounded-full bg-[oklch(0.55_0.14_290)]" />
        </div>
        <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-[oklch(0.50_0.015_260)]">
          lucid · matrix · this week
        </div>
        <div className="font-mono text-[10px] text-[oklch(0.62_0.16_35)]">●</div>
      </div>

      <div className="p-6">
        {/* Day header */}
        <div className="grid grid-cols-[120px_repeat(7,1fr)] gap-2 mb-3">
          <div />
          {DAYS.map((d, i) => (
            <div
              key={i}
              className="font-mono text-[10px] tracking-[0.2em] uppercase text-center text-[oklch(0.50_0.015_260)]"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Habit rows */}
        <div key={pulse} className="flex flex-col gap-2">
          {HABITS.map((habit, r) => (
            <div key={habit} className="grid grid-cols-[120px_repeat(7,1fr)] gap-2 items-center">
              <div className="font-sans text-sm text-[oklch(0.30_0.018_260)] truncate">
                {habit}
              </div>
              {PATTERN[r].map((on, c) => (
                <motion.div
                  key={c}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    delay: 0.05 * (r * 7 + c),
                    type: "spring",
                    stiffness: 220,
                    damping: 18,
                  }}
                  className="aspect-square rounded-sm border"
                  style={{
                    background: on
                      ? "oklch(0.62 0.16 35)"
                      : "oklch(0.93 0.011 75)",
                    borderColor: on
                      ? "oklch(0.55 0.16 35)"
                      : "oklch(0.85 0.012 75)",
                    boxShadow: on
                      ? "inset 0 0 0 1px oklch(0.70 0.14 35 / 0.4)"
                      : "none",
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Footer ticker */}
        <div className="mt-6 pt-4 border-t border-[oklch(0.85_0.012_75)] grid grid-cols-3 gap-4">
          <Stat label="Consistency" value="83%" accent />
          <Stat label="Streak" value="14d" />
          <Stat label="Verdict" value="green" />
        </div>
      </div>
    </motion.div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-[oklch(0.50_0.015_260)]">
        {label}
      </span>
      <span
        className={`font-serif italic text-xl ${
          accent ? "text-[oklch(0.62_0.16_35)]" : "text-[oklch(0.22_0.018_265)]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
