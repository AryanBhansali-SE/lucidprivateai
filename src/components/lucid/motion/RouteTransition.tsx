import { AnimatePresence, motion } from "framer-motion";
import { useRouterState } from "@tanstack/react-router";
import { useRef, type ReactNode } from "react";

const ORDER = ["/pulse", "/matrix", "/goals", "/journal", "/settings"];

function indexOf(path: string) {
  for (let i = 0; i < ORDER.length; i++) if (path.startsWith(ORDER[i])) return i;
  return -1;
}

/**
 * Wraps the authenticated <Outlet/> with a directional blur slide so
 * navigating Journal ↔ Pulse feels expensive and oriented.
 */
export function RouteTransition({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const prevRef = useRef(path);

  const prev = prevRef.current;
  const dir =
    indexOf(path) >= 0 && indexOf(prev) >= 0
      ? indexOf(path) > indexOf(prev)
        ? 1
        : indexOf(path) < indexOf(prev)
          ? -1
          : 0
      : 0;

  prevRef.current = path;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={path}
        initial={{ opacity: 0, x: dir * 24, filter: "blur(8px)" }}
        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, x: -dir * 24, filter: "blur(8px)" }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
