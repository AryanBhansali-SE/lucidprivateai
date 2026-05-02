import { motion, useMotionValue, useSpring } from "framer-motion";
import { useRef, type MouseEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  active?: boolean;
  /** Soft gold glow when filled */
  filled?: boolean;
  opacity?: number;
  title?: string;
  onClick?: () => void;
  children?: ReactNode;
  className?: string;
}

/**
 * A habit matrix cell that follows the cursor with a heavy, weighted
 * magnetic pull and lights up gold on hover.
 */
export function MagneticCell({
  filled = false,
  opacity = 1,
  title,
  onClick,
  children,
  className,
}: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 100, damping: 20 });
  const sy = useSpring(y, { stiffness: 100, damping: 20 });

  function handleMove(e: MouseEvent<HTMLButtonElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    // Magnetic pull, capped tightly so it stays subtle.
    x.set(dx * 0.35);
    y.set(dy * 0.35);
  }

  function handleLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={onClick}
      title={title}
      style={{ x: sx, y: sy }}
      whileHover={{
        boxShadow:
          "0 0 14px 1px color-mix(in oklch, var(--color-gold) 55%, transparent)",
      }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className={cn(
        "h-3.5 w-3.5 transition-colors",
        filled ? "bg-gold" : "bg-graphite hover:bg-graphite/70",
        className,
      )}
      // Inline opacity preserves tier scaling
      data-filled={filled}
    >
      {children}
      <span
        aria-hidden
        className="block w-full h-full"
        style={filled ? { opacity } : undefined}
      />
    </motion.button>
  );
}
