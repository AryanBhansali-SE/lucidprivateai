import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useAuthedServerFn } from "@/lib/use-authed-server-fn";
import { getOnboarding, markIntroSeen } from "@/server/onboarding.functions";
import { AtmosphericBackdrop } from "@/components/lucid/intro/AtmosphericScene";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [{ title: "Welcome — Lucid" }],
  }),
  component: WelcomePage,
});

const ACTS = [
  {
    eyebrow: "Welcome",
    title: "You've entered the terminal.",
    body: "Lucid is your private place to track who you're becoming. Quietly, deliberately.",
  },
  {
    eyebrow: "The Rituals",
    title: "Build habits that compound.",
    body: "Small marks every day. The Matrix shows your weeks the way time actually moves.",
  },
  {
    eyebrow: "The Aim",
    title: "Set objectives that have weight.",
    body: "Each one decomposes into measurable key results. The Analyst grades your trajectory.",
  },
  {
    eyebrow: "The Mirror",
    title: "Write to yourself.",
    body: "The Journal listens — and surfaces patterns when you ask.",
  },
  {
    eyebrow: "Ready",
    title: "Begin where you are.",
    body: "Open Pulse to see today.",
  },
];

const ACT_DURATION_MS = 4200;

function WelcomePage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const fetchOnboarding = useAuthedServerFn(getOnboarding);
  const markSeen = useAuthedServerFn(markIntroSeen);
  const [act, setAct] = useState(0);
  const [checked, setChecked] = useState(false);

  // Skip if user has already seen it
  useEffect(() => {
    if (!session) return;
    fetchOnboarding().then((r) => {
      if (r.intro_seen) {
        navigate({ to: "/pulse" });
      } else {
        setChecked(true);
      }
    });
  }, [session, fetchOnboarding, navigate]);

  // Auto-advance through acts
  useEffect(() => {
    if (!checked) return;
    if (act >= ACTS.length) return;
    const t = setTimeout(() => setAct((a) => a + 1), ACT_DURATION_MS);
    return () => clearTimeout(t);
  }, [act, checked]);

  // When done, mark seen and go to pulse
  useEffect(() => {
    if (!checked) return;
    if (act >= ACTS.length) {
      markSeen().finally(() => navigate({ to: "/pulse" }));
    }
  }, [act, checked, markSeen, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="font-serif italic text-[oklch(0.62_0.16_35)] text-3xl animate-pulse">Lucid</div>
      </div>
    );
  }
  if (!session) return <Navigate to="/auth" />;
  if (!checked) {
    return (
      <div className="min-h-screen grid place-items-center bg-[oklch(0.91_0.012_75)]">
        <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-[oklch(0.50_0.015_260)]">
          Preparing the terminal…
        </div>
      </div>
    );
  }

  const handleSkip = async () => {
    await markSeen();
    navigate({ to: "/pulse" });
  };

  const current = ACTS[Math.min(act, ACTS.length - 1)];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[oklch(0.91_0.012_75)]">
      <AtmosphericBackdrop />

      {/* Skip */}
      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 z-30 font-mono text-[10px] tracking-[0.3em] uppercase text-[oklch(0.50_0.015_260)] hover:text-[oklch(0.22_0.018_265)] transition-colors"
      >
        Skip →
      </button>

      {/* Progress dots */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 flex gap-3">
        {ACTS.map((_, i) => (
          <div
            key={i}
            className="h-px w-8 overflow-hidden bg-[oklch(0.22_0.018_265_/_0.15)]"
          >
            <motion.div
              className="h-full bg-[oklch(0.62_0.16_35)] origin-left"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: i < act ? 1 : i === act ? 1 : 0 }}
              transition={{
                duration: i === act ? ACT_DURATION_MS / 1000 : 0.4,
                ease: i === act ? "linear" : [0.22, 1, 0.36, 1],
              }}
            />
          </div>
        ))}
      </div>

      {/* Stage */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={act}
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -30, filter: "blur(10px)" }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="text-center max-w-3xl"
          >
            <div className="font-mono text-[11px] tracking-[0.3em] uppercase text-[oklch(0.50_0.015_260)] mb-6">
              {current.eyebrow}
            </div>
            <h1 className="font-serif text-[clamp(2.5rem,7vw,5rem)] leading-[1.05] text-[oklch(0.22_0.018_265)] mb-6">
              {current.title}
            </h1>
            <p className="font-sans text-base md:text-lg text-[oklch(0.40_0.015_260)] leading-relaxed max-w-xl mx-auto">
              {current.body}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
