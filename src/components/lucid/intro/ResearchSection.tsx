import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { LUCID_TWEEN } from "@/components/lucid/motion/ease";

type Stat = {
  figure: string;
  unit?: string;
  claim: string;
  source: string;
  numeric?: number;
  suffix?: string;
};

const STATS: Stat[] = [
  {
    figure: "66",
    unit: "days",
    numeric: 66,
    suffix: " days",
    claim:
      "Median time for a new behavior to become automatic — not the popular 21-day myth.",
    source: "Lally et al., European Journal of Social Psychology (2010)",
  },
  {
    figure: "2×",
    numeric: 2,
    suffix: "×",
    claim:
      "People who write down specific goals are 2× more likely to achieve them than those who don't.",
    source: "Dr. Gail Matthews, Dominican University study (2015)",
  },
  {
    figure: "42",
    unit: "%",
    numeric: 42,
    suffix: "%",
    claim:
      "Boost in goal achievement when progress is tracked and reviewed regularly.",
    source: "American Society of Training and Development",
  },
  {
    figure: "27",
    unit: "%",
    numeric: 27,
    suffix: "%",
    claim:
      "Higher follow-through when accountability is paired with a scheduled check-in with another person.",
    source: "ASTD / behavioral accountability research",
  },
  {
    figure: "3×",
    numeric: 3,
    suffix: "×",
    claim:
      "Reflective journaling is linked to up to 3× improvement in self-awareness and emotional regulation.",
    source: "Pennebaker, University of Texas (expressive writing research)",
  },
  {
    figure: "+15",
    unit: "%",
    numeric: 15,
    suffix: "%",
    claim:
      "Lift in task engagement and persistence when progress is gamified with points and visible streaks.",
    source: "Hamari et al., meta-analysis on gamification (2014)",
  },
];

function CountUp({ to, suffix = "", duration = 1.4 }: { to: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(to * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);

  const display = to >= 10 ? Math.round(val).toString() : val.toFixed(val < to ? 1 : 0);
  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}

export function ResearchSection() {
  return (
    <section className="relative px-6 md:px-16 py-32">
      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={LUCID_TWEEN}
          className="font-mono text-[11px] tracking-[0.3em] uppercase text-[oklch(0.50_0.015_260)] mb-4 text-center"
        >
          The Evidence
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ ...LUCID_TWEEN, duration: 0.9 }}
          className="font-serif text-[clamp(2rem,5vw,3.5rem)] leading-[1.05] text-[oklch(0.22_0.018_265)] text-center mb-4"
        >
          Why this <em className="text-[oklch(0.62_0.16_35)]">actually</em> works.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ ...LUCID_TWEEN, delay: 0.15 }}
          className="font-sans text-base md:text-lg text-[oklch(0.40_0.015_260)] text-center max-w-2xl mx-auto mb-16"
        >
          Lucid isn't a productivity opinion. Every mechanic — habit grids, written
          goals, journaling, points, accountability — is grounded in decades of
          behavioral science.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[oklch(0.80_0.014_75)] border border-[oklch(0.80_0.014_75)]">
          {STATS.map((s, i) => (
            <motion.div
              key={s.figure}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ ...LUCID_TWEEN, delay: i * 0.06 }}
              className="bg-[oklch(0.95_0.010_75)] p-8 flex flex-col gap-4 hover:bg-[oklch(0.97_0.008_75)] transition-colors duration-500"
            >
              <div className="flex items-baseline gap-2">
                <div className="font-serif text-[clamp(3rem,5vw,4.5rem)] leading-none text-[oklch(0.62_0.16_35)]">
                  {s.numeric !== undefined ? (
                    <CountUp to={s.numeric} suffix={s.suffix ?? ""} />
                  ) : (
                    s.figure
                  )}
                </div>
                {s.unit && !s.suffix && (
                  <div className="font-mono text-xs tracking-[0.2em] uppercase text-[oklch(0.50_0.015_260)] pb-2">
                    {s.unit}
                  </div>
                )}
              </div>
              <p className="font-sans text-[15px] leading-relaxed text-[oklch(0.30_0.018_260)]">
                {s.claim}
              </p>
              <div className="mt-auto pt-4 border-t border-[oklch(0.85_0.012_75)] font-mono text-[10px] tracking-[0.18em] uppercase text-[oklch(0.55_0.015_260)]">
                {s.source}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const PILLARS = [
  {
    glyph: "01",
    title: "Habits compound. Lucid makes the chain visible.",
    body:
      "Behavioral research is unambiguous: small, repeated actions outperform sporadic intensity. The Matrix shows your weeks as a calm, factual record — no shouting, no streaks designed to manipulate you.",
    tag: "Habit formation",
  },
  {
    glyph: "02",
    title: "Written goals get done.",
    body:
      "Matthews' study found goal-setters who write down their objectives are roughly 2× more likely to achieve them. Lucid forces specificity: a goal, its key results, and its trajectory.",
    tag: "Goal commitment",
  },
  {
    glyph: "03",
    title: "Reflection is a performance tool.",
    body:
      "Twenty years of expressive-writing research shows journaling sharpens self-awareness and reduces the noise that erodes consistency. The Journal scores sentiment so you can see the weather of your week.",
    tag: "Self-knowledge",
  },
  {
    glyph: "04",
    title: "Points and visibility move behavior.",
    body:
      "Meta-analyses of gamification show measurable lifts in engagement when progress is rewarded and visible. Lucid turns consistency into a quiet score — the kind you'd compete with yourself, or one trusted friend, over.",
    tag: "Reward systems",
  },
];

export function PillarsSection() {
  return (
    <section className="relative px-6 md:px-16 py-32">
      <div className="relative z-10 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={LUCID_TWEEN}
          className="font-mono text-[11px] tracking-[0.3em] uppercase text-[oklch(0.50_0.015_260)] mb-4"
        >
          The Pillars
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ ...LUCID_TWEEN, duration: 0.9 }}
          className="font-serif text-[clamp(2rem,5vw,3.5rem)] leading-[1.05] text-[oklch(0.22_0.018_265)] mb-16 max-w-3xl"
        >
          Four mechanisms. Each one earned its place.
        </motion.h2>

        <div className="flex flex-col">
          {PILLARS.map((p, i) => (
            <motion.div
              key={p.glyph}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ ...LUCID_TWEEN, delay: i * 0.08 }}
              className="grid grid-cols-12 gap-6 py-10 border-t border-[oklch(0.80_0.014_75)] last:border-b group"
            >
              <div className="col-span-12 md:col-span-2 font-serif italic text-4xl text-[oklch(0.62_0.16_35)] leading-none">
                {p.glyph}
              </div>
              <div className="col-span-12 md:col-span-7">
                <h3 className="font-serif text-2xl md:text-3xl leading-tight text-[oklch(0.22_0.018_265)] mb-3 group-hover:translate-x-1 transition-transform duration-500">
                  {p.title}
                </h3>
                <p className="font-sans text-[15px] md:text-base leading-relaxed text-[oklch(0.40_0.015_260)] max-w-xl">
                  {p.body}
                </p>
              </div>
              <div className="col-span-12 md:col-span-3 md:text-right">
                <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[oklch(0.50_0.015_260)] border border-[oklch(0.80_0.014_75)] px-3 py-1.5 inline-block">
                  {p.tag}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
