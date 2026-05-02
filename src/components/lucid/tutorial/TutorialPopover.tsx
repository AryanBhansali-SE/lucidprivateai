import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useAuthedServerFn } from "@/lib/use-authed-server-fn";
import { getOnboarding, dismissTutorial } from "@/server/onboarding.functions";

type TutorialCtx = {
  dismissed: Set<string>;
  ready: boolean;
  dismiss: (key: string) => void;
  resetAll: () => void;
};

const Ctx = createContext<TutorialCtx | null>(null);

export function TutorialProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const fetchOnboarding = useAuthedServerFn(getOnboarding);
  const dismissFn = useAuthedServerFn(dismissTutorial);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetchOnboarding().then((r) => {
      setDismissed(new Set(r.tutorial_dismissed));
      setReady(true);
    });
  }, [session, fetchOnboarding]);

  const dismiss = useCallback(
    (key: string) => {
      setDismissed((prev) => {
        if (prev.has(key)) return prev;
        const next = new Set(prev);
        next.add(key);
        return next;
      });
      dismissFn({ data: { key } }).catch(() => {});
    },
    [dismissFn],
  );

  const resetAll = useCallback(() => {
    setDismissed(new Set());
  }, []);

  return <Ctx.Provider value={{ dismissed, ready, dismiss, resetAll }}>{children}</Ctx.Provider>;
}

export function useTutorial() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTutorial must be used within TutorialProvider");
  return ctx;
}

/**
 * A contextual tooltip that appears once per user, anchored to a corner of the screen.
 * Auto-dismisses on close. Call once per page near the top of the component.
 */
export function TutorialPopover({
  tutorialKey,
  title,
  body,
  position = "bottom-right",
  delay = 800,
}: {
  tutorialKey: string;
  title: string;
  body: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  delay?: number;
}) {
  const { dismissed, ready, dismiss } = useTutorial();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (dismissed.has(tutorialKey)) return;
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [ready, dismissed, tutorialKey, delay]);

  const close = () => {
    setVisible(false);
    dismiss(tutorialKey);
  };

  const posCls = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "top-right": "top-20 right-6",
    "top-left": "top-20 left-6",
  }[position];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className={`fixed ${posCls} z-50 max-w-sm`}
        >
          <div className="relative bg-[oklch(0.935_0.010_75)] border border-[oklch(0.62_0.16_35)] rounded-sm shadow-[0_20px_60px_-20px_oklch(0.22_0.018_265_/_0.40)] p-5 pr-10">
            {/* Coral accent bar */}
            <div className="absolute left-0 top-0 bottom-0 w-px bg-[oklch(0.62_0.16_35)]" />

            <button
              onClick={close}
              aria-label="Dismiss tip"
              className="absolute top-3 right-3 text-[oklch(0.50_0.015_260)] hover:text-[oklch(0.22_0.018_265)] transition-colors"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>

            <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-[oklch(0.62_0.16_35)] mb-2">
              Tip
            </div>
            <div className="font-serif text-lg text-[oklch(0.22_0.018_265)] mb-2 leading-snug">
              {title}
            </div>
            <p className="font-sans text-sm text-[oklch(0.40_0.015_260)] leading-relaxed mb-4">{body}</p>
            <button
              onClick={close}
              className="font-mono text-[10px] tracking-[0.3em] uppercase text-[oklch(0.22_0.018_265)] border-b border-[oklch(0.22_0.018_265_/_0.3)] pb-0.5 hover:border-[oklch(0.62_0.16_35)] hover:text-[oklch(0.62_0.16_35)] transition-colors"
            >
              Got it →
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
