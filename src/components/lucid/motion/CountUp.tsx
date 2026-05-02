import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";

interface Props {
  to: number;
  /** Animation duration in seconds */
  duration?: number;
  /** Formatter (e.g., for percentages or rounding) */
  format?: (n: number) => string;
  className?: string;
  /** Re-trigger when this key changes */
  trigger?: string | number;
  /** Delay before starting */
  delay?: number;
}

/**
 * Counts up from zero (or previous value) to target with a heavy,
 * exponential ease — no bounce.
 */
export function CountUp({
  to,
  duration = 1.1,
  format,
  className,
  trigger,
  delay = 0,
}: Props) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const controls = animate(fromRef.current, to, {
      duration,
      delay,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
      onComplete: () => {
        fromRef.current = to;
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to, trigger]);

  return (
    <span className={className}>
      {format ? format(display) : Math.round(display).toString()}
    </span>
  );
}
