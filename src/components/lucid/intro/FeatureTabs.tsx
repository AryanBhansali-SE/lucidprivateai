import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LUCID_TWEEN } from "@/components/lucid/motion/ease";
import { Grid3x3, Target, BookText, Sparkles, Calendar, BarChart3 } from "lucide-react";

type Tab = {
  id: string;
  label: string;
  eyebrow: string;
  title: string;
  body: string;
  icon: React.ElementType;
  status?: "live" | "soon";
  visual: React.ReactNode;
};

const TABS: Tab[] = [
  {
    id: "matrix",
    label: "Habit Matrix",
    eyebrow: "01 / Habits",
    title: "A grid that doesn't lie.",
    body: "Each row a habit, each column a day. No streaks shouted at you, no confetti — just a quiet record of who you've actually been showing up as.",
    icon: Grid3x3,
    status: "live",
    visual: <MatrixVisual />,
  },
  {
    id: "goals",
    label: "Objectives",
    eyebrow: "02 / Goals",
    title: "Goals with weight, not wallpaper.",
    body: "Each objective decomposes into key results. Lucid grades the trajectory red / amber / green so you know if you're on the line, or behind it.",
    icon: Target,
    status: "live",
    visual: <GoalsVisual />,
  },
  {
    id: "journal",
    label: "Journal",
    eyebrow: "03 / Reflection",
    title: "A page that listens back.",
    body: "Write freely. Lucid scores sentiment, surfaces recurring themes, and holds your patterns up to the light when you ask.",
    icon: BookText,
    status: "live",
    visual: <JournalVisual />,
  },
  {
    id: "analyst",
    label: "AI Analyst",
    eyebrow: "04 / Insight",
    title: "An AI that notices what you don't.",
    body: "Reads thirty days of your habits, goals, and reflections — then names the pattern. Where you slip, what correlates with consistency, what to do today.",
    icon: Sparkles,
    status: "live",
    visual: <AnalystVisual />,
  },
  {
    id: "viz",
    label: "Terminal",
    eyebrow: "05 / Data",
    title: "Bloomberg, but for your inner life.",
    body: "Dense, mono-typed panels. Sparklines, deltas, micro-stats. Every number earns its place. Built for people who actually read their own dashboards.",
    icon: BarChart3,
    status: "live",
    visual: <TerminalVisual />,
  },
  {
    id: "calendar",
    label: "Calendar",
    eyebrow: "06 / Schedule",
    title: "Your habits, on the wall clock.",
    body: "Connect Google Calendar so Lucid can schedule your habits into real time blocks and read what your week actually looked like.",
    icon: Calendar,
    status: "soon",
    visual: <CalendarVisual />,
  },
];

export function FeatureTabs() {
  const [active, setActive] = useState<string>(TABS[0].id);
  const tab = TABS.find((t) => t.id === active)!;

  return (
    <section id="features" className="relative px-6 md:px-16 py-24 md:py-32">
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={LUCID_TWEEN}
          className="mb-12 md:mb-16 text-center"
        >
          <div className="font-mono text-[11px] tracking-[0.3em] uppercase text-[oklch(0.50_0.015_260)] mb-4">
            What's inside
          </div>
          <h2 className="font-serif text-[clamp(2rem,5vw,3.5rem)] leading-tight text-[oklch(0.22_0.018_265)] max-w-2xl mx-auto">
            Six instruments. One quiet terminal.
          </h2>
        </motion.div>

        {/* Tab strip */}
        <div className="flex flex-wrap justify-center gap-1 md:gap-2 mb-10 md:mb-14 border-y border-[oklch(0.80_0.014_75)] py-3">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = t.id === active;
            return (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={`group relative flex items-center gap-2 px-3 md:px-4 py-2 font-mono text-[10px] md:text-[11px] tracking-[0.25em] uppercase transition-colors ${
                  isActive
                    ? "text-[oklch(0.62_0.16_35)]"
                    : "text-[oklch(0.50_0.015_260)] hover:text-[oklch(0.22_0.018_265)]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span>{t.label}</span>
                {t.status === "soon" && (
                  <span className="text-[8px] px-1 border border-[oklch(0.55_0.14_290)] text-[oklch(0.55_0.14_290)] rounded-sm">
                    soon
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="tabIndicator"
                    className="absolute -bottom-3 left-0 right-0 h-px bg-[oklch(0.62_0.16_35)]"
                    transition={{ ...LUCID_TWEEN, duration: 0.4 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Active panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={LUCID_TWEEN}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center"
          >
            <div className="order-2 lg:order-1">
              <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-[oklch(0.50_0.015_260)] mb-4">
                {tab.eyebrow}
              </div>
              <h3 className="font-serif text-[clamp(1.75rem,4vw,2.75rem)] leading-tight text-[oklch(0.22_0.018_265)] mb-5">
                {tab.title}
              </h3>
              <p className="font-sans text-base md:text-lg text-[oklch(0.40_0.015_260)] leading-relaxed max-w-md">
                {tab.body}
              </p>
              {tab.status === "soon" && (
                <div className="mt-6 inline-block border border-[oklch(0.55_0.14_290)] bg-[oklch(0.55_0.14_290_/_0.06)] px-3 py-1.5 font-mono text-[10px] tracking-[0.25em] uppercase text-[oklch(0.55_0.14_290)]">
                  Coming soon · Google Calendar
                </div>
              )}
            </div>
            <div className="order-1 lg:order-2 relative">
              <div className="relative border border-[oklch(0.80_0.014_75)] bg-[oklch(0.95_0.010_75_/_0.6)] backdrop-blur-sm p-5 md:p-6 rounded-sm shadow-[0_30px_80px_-30px_oklch(0.22_0.018_265_/_0.25)]">
                {tab.visual}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

/* -------- Visuals -------- */

function MatrixVisual() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[oklch(0.50_0.015_260)]">
          Matrix · last 14 days
        </span>
        <span className="font-mono text-[10px] text-[oklch(0.62_0.16_35)]">73%</span>
      </div>
      <div className="space-y-1.5">
        {["Read", "Train", "Write", "Sleep early"].map((row, r) => (
          <div key={row} className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase text-[oklch(0.40_0.015_260)] w-20 truncate">
              {row}
            </span>
            <div className="flex gap-[3px] flex-1">
              {Array.from({ length: 14 }).map((_, c) => {
                const filled = Math.random() > 0.3 + r * 0.05;
                return (
                  <motion.div
                    key={c}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 + (r * 14 + c) * 0.012, ...LUCID_TWEEN }}
                    className="flex-1 aspect-square"
                    style={{
                      background: filled
                        ? "oklch(0.62 0.16 35 / 0.85)"
                        : "oklch(0.80 0.014 75)",
                    }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GoalsVisual() {
  const goals = [
    { name: "Ship v1", pct: 78, status: "GREEN" },
    { name: "10kg deadlift PR", pct: 45, status: "AMBER" },
    { name: "Read 12 books", pct: 22, status: "RED" },
  ];
  const color = (s: string) =>
    s === "GREEN" ? "oklch(0.62 0.14 150)" : s === "AMBER" ? "oklch(0.78 0.14 70)" : "oklch(0.58 0.20 25)";
  return (
    <div className="space-y-4">
      <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-[oklch(0.50_0.015_260)]">
        Objectives · Q-trajectory
      </div>
      {goals.map((g, i) => (
        <motion.div
          key={g.name}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 + i * 0.1, ...LUCID_TWEEN }}
        >
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="font-sans text-sm text-[oklch(0.22_0.018_265)]">{g.name}</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] tracking-[0.2em]" style={{ color: color(g.status) }}>
                {g.status}
              </span>
              <span className="font-serif italic text-base text-[oklch(0.22_0.018_265)]">{g.pct}%</span>
            </div>
          </div>
          <div className="h-[3px] bg-[oklch(0.85_0.014_75)] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${g.pct}%` }}
              transition={{ delay: 0.3 + i * 0.1, duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="h-full"
              style={{ background: color(g.status) }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function JournalVisual() {
  return (
    <div>
      <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-[oklch(0.50_0.015_260)] mb-3">
        Entry · 02 May
      </div>
      <p className="font-serif italic text-[oklch(0.22_0.018_265)] text-base leading-relaxed mb-4">
        "Trained early. Mind quiet. Felt the work pay back something it had borrowed."
      </p>
      <div className="flex flex-wrap gap-1.5">
        {[
          { l: "discipline", c: "oklch(0.62 0.16 35)" },
          { l: "calm", c: "oklch(0.55 0.14 290)" },
          { l: "momentum", c: "oklch(0.62 0.14 150)" },
        ].map((t, i) => (
          <motion.span
            key={t.l}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1, ...LUCID_TWEEN }}
            className="font-mono text-[9px] tracking-[0.25em] uppercase border px-2 py-0.5"
            style={{ borderColor: t.c, color: t.c }}
          >
            {t.l}
          </motion.span>
        ))}
      </div>
      <div className="mt-5 pt-4 border-t border-[oklch(0.80_0.014_75)]">
        <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-[oklch(0.50_0.015_260)] mb-2">
          Sentiment arc · 7d
        </div>
        <svg viewBox="0 0 200 40" className="w-full h-10">
          <motion.path
            d="M0 30 C 30 20, 60 35, 90 18 S 150 8, 200 14"
            fill="none"
            stroke="oklch(0.62 0.16 35)"
            strokeWidth="1.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
      </div>
    </div>
  );
}

function AnalystVisual() {
  const lines = [
    "› reading 30 days of habits",
    "› cross-referencing journal sentiment",
    "› pattern: consistency drops -38% on travel days",
    "› priority for today: protect sleep window",
  ];
  return (
    <div className="font-mono text-[12px] leading-relaxed text-[oklch(0.22_0.018_265)] space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-3.5 w-3.5 text-[oklch(0.62_0.16_35)]" strokeWidth={1.5} />
        <span className="text-[10px] tracking-[0.25em] uppercase text-[oklch(0.50_0.015_260)]">
          Analyst · live
        </span>
      </div>
      {lines.map((l, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 + i * 0.25, ...LUCID_TWEEN }}
          className={i === lines.length - 1 ? "text-[oklch(0.62_0.16_35)] italic" : ""}
        >
          {l}
        </motion.div>
      ))}
    </div>
  );
}

function TerminalVisual() {
  const stats = [
    { k: "SCORE", v: "84", d: "+6" },
    { k: "STREAK", v: "21d", d: "+1" },
    { k: "GOALS", v: "5", d: "·" },
    { k: "MOOD", v: "+0.42", d: "↑" },
  ];
  return (
    <div>
      <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-[oklch(0.50_0.015_260)] mb-3">
        Pulse terminal · 7d window
      </div>
      <div className="grid grid-cols-4 gap-px bg-[oklch(0.80_0.014_75)] mb-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.k}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 + i * 0.08, ...LUCID_TWEEN }}
            className="bg-[oklch(0.95_0.010_75)] p-3"
          >
            <div className="font-mono text-[9px] tracking-[0.2em] text-[oklch(0.50_0.015_260)]">
              {s.k}
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="font-serif text-2xl text-[oklch(0.22_0.018_265)]">{s.v}</span>
              <span className="font-mono text-[10px] text-[oklch(0.62_0.16_35)]">{s.d}</span>
            </div>
          </motion.div>
        ))}
      </div>
      <svg viewBox="0 0 200 50" className="w-full h-14">
        <motion.path
          d="M0 35 L 20 32 L 40 36 L 60 28 L 80 30 L 100 22 L 120 25 L 140 18 L 160 20 L 180 12 L 200 15"
          fill="none"
          stroke="oklch(0.62 0.16 35)"
          strokeWidth="1.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.path
          d="M0 35 L 20 32 L 40 36 L 60 28 L 80 30 L 100 22 L 120 25 L 140 18 L 160 20 L 180 12 L 200 15 L 200 50 L 0 50 Z"
          fill="oklch(0.62 0.16 35 / 0.10)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
        />
      </svg>
    </div>
  );
}

function CalendarVisual() {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[oklch(0.50_0.015_260)]">
          Week · scheduled
        </span>
        <span className="font-mono text-[9px] tracking-[0.2em] text-[oklch(0.55_0.14_290)] border border-[oklch(0.55_0.14_290)] px-1.5 py-0.5">
          GCAL · linked
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d, i) => (
          <div key={i} className="text-center">
            <div className="font-mono text-[9px] text-[oklch(0.50_0.015_260)] mb-1.5">{d}</div>
            <div className="space-y-1">
              {[0, 1, 2].map((j) => {
                const filled = Math.random() > 0.4;
                return (
                  <motion.div
                    key={j}
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    transition={{ delay: 0.1 + (i * 3 + j) * 0.04, ...LUCID_TWEEN }}
                    className="h-3"
                    style={{
                      background: filled
                        ? j === 0
                          ? "oklch(0.62 0.16 35 / 0.7)"
                          : j === 1
                            ? "oklch(0.55 0.14 290 / 0.6)"
                            : "oklch(0.62 0.14 150 / 0.6)"
                        : "oklch(0.85 0.014 75)",
                      transformOrigin: "top",
                    }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-[oklch(0.80_0.014_75)] font-mono text-[10px] text-[oklch(0.50_0.015_260)] leading-relaxed">
        Block your habits into real time. Lucid reads back what your week looked like vs. what you planned.
      </div>
    </div>
  );
}
