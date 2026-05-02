import { motion } from "framer-motion";
import { useMemo } from "react";

interface Props {
  /** 0..1 — habit completion ratio for today */
  value: number;
  size?: number;
  label?: string;
  sublabel?: string;
}

/**
 * The "Pulse" hero header — an animated, glowing ring that breathes
 * slowly based on real-time habit completion.
 */
export function PulseRing({ value, size = 220, label, sublabel }: Props) {
  const v = Math.max(0, Math.min(1, value));
  const stroke = 2;
  const r = (size - stroke) / 2 - 14;
  const c = 2 * Math.PI * r;
  const dashOffset = c * (1 - v);

  // Breath cycle scales with completion: more done → calmer, slower breath.
  const breathDuration = useMemo(() => 3.6 + v * 2.4, [v]);

  return (
    <div
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
    >
      {/* Outer glow that breathes */}
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklch, var(--color-gold) 22%, transparent) 0%, transparent 65%)",
        }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.55, 0.95, 0.55] }}
        transition={{
          duration: breathDuration,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Ring */}
      <svg width={size} height={size} className="relative z-10 -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-hairline)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-gold)"
          strokeWidth={stroke}
          strokeLinecap="butt"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          style={{
            filter: "drop-shadow(0 0 6px color-mix(in oklch, var(--color-gold) 60%, transparent))",
          }}
        />
        {/* tick marks */}
        {Array.from({ length: 60 }).map((_, i) => {
          const angle = (i / 60) * Math.PI * 2;
          const inner = r - 6;
          const outer = r - 2;
          const x1 = size / 2 + Math.cos(angle) * inner;
          const y1 = size / 2 + Math.sin(angle) * inner;
          const x2 = size / 2 + Math.cos(angle) * outer;
          const y2 = size / 2 + Math.sin(angle) * outer;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="var(--color-hairline)"
              strokeWidth={i % 5 === 0 ? 0.8 : 0.3}
              opacity={i % 5 === 0 ? 0.7 : 0.35}
            />
          );
        })}
      </svg>

      {/* Center label */}
      <div className="absolute inset-0 grid place-items-center text-center pointer-events-none">
        <div>
          <div className="font-serif text-bone text-5xl leading-none num tabular">
            {Math.round(v * 100)}
            <span className="text-ash text-2xl align-top ml-0.5">%</span>
          </div>
          {label && (
            <div className="label-cap mt-2">{label}</div>
          )}
          {sublabel && (
            <div className="font-mono text-[10px] text-ash mt-1 tracking-widest">
              {sublabel}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
