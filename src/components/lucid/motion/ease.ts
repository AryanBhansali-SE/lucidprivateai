// Centralized motion language for LUCID.
// Heavy, mechanical, expensive. No bounce. Weighted damping.
import type { Transition } from "framer-motion";

export const LUCID_SPRING: Transition = {
  type: "spring",
  stiffness: 100,
  damping: 20,
  mass: 1,
};

export const LUCID_TWEEN: Transition = {
  type: "tween",
  duration: 0.45,
  ease: [0.22, 1, 0.36, 1], // exponential out
};

export const LUCID_TWEEN_FAST: Transition = {
  type: "tween",
  duration: 0.28,
  ease: [0.22, 1, 0.36, 1],
};

export const STAGGER_INCREMENT = 0.05;
