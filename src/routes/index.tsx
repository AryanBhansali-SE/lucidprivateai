import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { AtmosphericBackdrop } from "@/components/lucid/intro/AtmosphericScene";
import { SceneBlock, DriftingChip } from "@/components/lucid/intro/IntroScenes";
import { LiveMatrixPreview } from "@/components/lucid/intro/LiveMatrixPreview";
import { ResearchSection, PillarsSection } from "@/components/lucid/intro/ResearchSection";
import { FeatureTabs } from "@/components/lucid/intro/FeatureTabs";
import { LUCID_TWEEN } from "@/components/lucid/motion/ease";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lucid — A private terminal for the inner life" },
      {
        name: "description",
        content:
          "Lucid is a quiet performance terminal. Track habits, objectives, and journaled intent in a calm, banking-grade interface — with an AI that watches the patterns you can't.",
      },
      { property: "og:title", content: "Lucid — A private terminal for the inner life" },
      {
        property: "og:description",
        content:
          "A quiet, cinematic place to track habits, objectives, and reflection. With AI that surfaces what you cannot see.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { session, loading } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="font-serif italic text-[oklch(0.62_0.16_35)] text-3xl animate-pulse">Lucid</div>
      </div>
    );
  }
  if (session) return <Navigate to="/pulse" />;

  return (
    <div ref={containerRef} className="relative bg-[oklch(0.91_0.012_75)] overflow-x-hidden">
      <AtmosphericBackdrop scrollTarget={containerRef} />

      {/* Top nav */}
      <header className="relative z-20 flex items-center justify-between px-6 md:px-10 py-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={LUCID_TWEEN}
          className="font-serif italic text-[oklch(0.62_0.16_35)] text-2xl"
        >
          Lucid
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...LUCID_TWEEN, delay: 0.1 }}
        >
          <Link
            to="/auth"
            className="font-mono text-[11px] tracking-[0.3em] uppercase text-[oklch(0.22_0.018_265)] border-b border-[oklch(0.22_0.018_265_/_0.3)] pb-1 hover:border-[oklch(0.62_0.16_35)] transition-colors"
          >
            Enter →
          </Link>
        </motion.div>
      </header>

      {/* Scene 1 — Hero */}
      <HeroScene />

      {/* Scene 2 — What it is */}
      <Scene align="center" id="essence">
        <SceneBlock
          eyebrow="A new kind of terminal"
          title="Quiet instruments for the inner life."
          body="Most apps shout. Lucid keeps its voice down. A measured, banking-grade interface for the things that actually compound — habits, objectives, and the words you write to yourself."
        />
      </Scene>

      {/* Feature tabs — what we offer at a glance */}
      <FeatureTabs />
          eyebrow="A new kind of terminal"
          title="Quiet instruments for the inner life."
          body="Most apps shout. Lucid keeps its voice down. A measured, banking-grade interface for the things that actually compound — habits, objectives, and the words you write to yourself."
        />
      </Scene>

      {/* Scene 3 — Habit Matrix with live preview */}
      <section id="habits" className="relative min-h-[90svh] flex items-center px-6 md:px-16 py-24">
        <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <SceneBlock
            eyebrow="The Matrix"
            title="See your weeks the way time actually moves."
            body="A grid of small marks. Each cell a day, each row a habit. No streaks shouted at you, no confetti — just a clean record of who you've been showing up as."
            align="left"
          />
          <LiveMatrixPreview />
        </div>
      </section>

      {/* Pillars — research-grounded mechanisms */}
      <PillarsSection />

      {/* Research evidence */}
      <ResearchSection />

      {/* Scene 4 — Goals */}
      <Scene align="right" id="goals">
        <SceneBlock
          eyebrow="Objectives"
          title="Goals with weight, not wallpaper."
          body="Each objective decomposes into measurable key results. Lucid's AI grades the trajectory — red, amber, green — so you know if you're on the line, or behind it."
          align="right"
        />
        <DriftingChip label="On Track" value="GREEN" className="top-16 left-4 md:left-20" delay={0.4} />
        <DriftingChip label="Verdict" value="hold steady" className="bottom-12 left-16 md:left-40" delay={0.6} />
      </Scene>

      {/* Scene 5 — Journal */}
      <Scene align="center" id="journal">
        <SceneBlock
          eyebrow="The Journal"
          title="A page that listens back."
          body="Write freely. Lucid scores the sentiment, surfaces the recurring themes, and holds your patterns up to the light when you ask."
        />
      </Scene>

      {/* Scene 6 — AI */}
      <Scene align="center" id="analyst">
        <SceneBlock
          eyebrow="The Analyst"
          title="An AI that notices what you don't."
          body="It reads thirty days of your habits, goals, and reflections — then names the pattern. Where you slip, what correlates with consistency, what to do today."
        />
        <DriftingChip label="Pattern" value="✦" className="top-20 left-8 md:left-24" delay={0.5} />
        <DriftingChip label="Today" value="01" className="bottom-16 right-8 md:right-24" delay={0.7} />
      </Scene>

      {/* Final CTA */}
      <FinalScene />

      <footer className="relative z-10 border-t border-[oklch(0.80_0.014_75)] py-8 px-6 md:px-10 text-center font-mono text-[10px] tracking-[0.3em] uppercase text-[oklch(0.50_0.015_260)]">
        Lucid · A Private Performance Terminal
      </footer>
    </div>
  );
}

function HeroScene() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-[100svh] flex items-center justify-center px-6">
      <motion.div style={{ y, opacity }} className="relative z-10 flex flex-col items-center text-center max-w-4xl">
        <motion.div
          initial={{ opacity: 0, letterSpacing: "1em" }}
          animate={{ opacity: 1, letterSpacing: "0.3em" }}
          transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1] }}
          className="font-mono text-[11px] uppercase text-[oklch(0.50_0.015_260)] mb-8"
        >
          A Private Performance Terminal
        </motion.div>

        <h1 className="font-serif text-[clamp(3.5rem,11vw,9rem)] leading-[0.95] text-[oklch(0.22_0.018_265)] mb-6">
          {"Lucid".split("").map((c, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 60, filter: "blur(20px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                duration: 1.4,
                delay: 0.4 + i * 0.12,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="inline-block"
              style={i === 2 ? { fontStyle: "italic", color: "oklch(0.62 0.16 35)" } : undefined}
            >
              {c}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="font-sans text-lg md:text-xl text-[oklch(0.40_0.015_260)] max-w-xl leading-relaxed mb-12"
        >
          A quiet place to track habits, objectives, and the words you write to yourself.
          <br />
          With an AI that watches the patterns you can't.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-3"
        >
          <Link
            to="/auth"
            className="group relative inline-flex items-center gap-3 bg-[oklch(0.22_0.018_265)] text-[oklch(0.95_0.010_75)] px-10 py-4 font-mono text-[11px] tracking-[0.3em] uppercase hover:bg-[oklch(0.62_0.16_35)] transition-colors duration-500"
          >
            Begin
            <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
          </Link>
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[oklch(0.50_0.015_260)] mt-2">
            Scroll to look closer
          </span>
        </motion.div>

        <LiveTicker />
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 12, 0], opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 w-px h-12 bg-[oklch(0.22_0.018_265)] z-10"
      />
    </section>
  );
}

function LiveTicker() {
  const items = [
    { k: "Habits logged today", v: "1,284" },
    { k: "Goals on track", v: "73%" },
    { k: "Median consistency", v: "66 days" },
    { k: "Reflections written", v: "412" },
    { k: "AI patterns surfaced", v: "37" },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2.4, duration: 1, ease: [0.22, 1, 0.36, 1] }}
      className="mt-16 w-full max-w-3xl overflow-hidden border-y border-[oklch(0.80_0.014_75)] bg-[oklch(0.95_0.010_75_/_0.5)] backdrop-blur-sm"
    >
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="flex gap-12 py-3 whitespace-nowrap"
      >
        {[...items, ...items, ...items].map((it, i) => (
          <span key={i} className="inline-flex items-center gap-3 font-mono text-[10px] tracking-[0.25em] uppercase text-[oklch(0.50_0.015_260)]">
            <span className="w-1 h-1 rounded-full bg-[oklch(0.62_0.16_35)]" />
            {it.k}
            <span className="font-serif italic text-base text-[oklch(0.62_0.16_35)] normal-case tracking-normal">{it.v}</span>
          </span>
        ))}
      </motion.div>
    </motion.div>
  );
}

function Scene({ children, align, id }: { children: React.ReactNode; align: "left" | "center" | "right"; id: string }) {
  const justify = align === "left" ? "justify-start" : align === "right" ? "justify-end" : "justify-center";
  return (
    <section id={id} className={`relative min-h-[90svh] flex items-center ${justify} px-6 md:px-16 py-24`}>
      <div className="relative z-10 w-full flex flex-col items-stretch md:items-center">
        <div className={`relative w-full flex ${justify}`}>{children}</div>
      </div>
    </section>
  );
}

function FinalScene() {
  return (
    <section className="relative min-h-[90svh] flex items-center justify-center px-6 py-24">
      <div className="relative z-10 flex flex-col items-center text-center max-w-3xl">
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="w-12 h-px bg-[oklch(0.62_0.16_35)] mb-10"
        />
        <motion.h2
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="font-serif text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.05] text-[oklch(0.22_0.018_265)] mb-8"
        >
          The terminal is <em className="text-[oklch(0.62_0.16_35)]">open</em>.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="font-sans text-lg text-[oklch(0.40_0.015_260)] mb-12"
        >
          Sign in to begin tracking your week.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            to="/auth"
            className="inline-flex items-center gap-3 bg-[oklch(0.62_0.16_35)] text-[oklch(0.98_0.005_75)] px-12 py-4 font-mono text-[11px] tracking-[0.3em] uppercase hover:bg-[oklch(0.22_0.018_265)] transition-colors duration-500"
          >
            Enter Lucid →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
