import { motion } from "framer-motion";
import { LUCID_TWEEN } from "@/components/lucid/motion/ease";

/**
 * Reusable scene block: serif heading + subline,
 * with staggered word reveal and ink-bloom emphasis.
 */
export function SceneBlock({
  eyebrow,
  title,
  body,
  align = "center",
  delay = 0,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  align?: "center" | "left" | "right";
  delay?: number;
}) {
  const words = title.split(" ");

  const alignCls =
    align === "left" ? "items-start text-left" : align === "right" ? "items-end text-right" : "items-center text-center";

  return (
    <div className={`flex flex-col gap-6 ${alignCls} max-w-3xl`}>
      {eyebrow && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ ...LUCID_TWEEN, delay }}
          className="font-mono text-[11px] tracking-[0.3em] uppercase text-[oklch(0.50_0.015_260)]"
        >
          {eyebrow}
        </motion.div>
      )}

      <h2 className="font-serif text-[clamp(2.5rem,7vw,5.5rem)] leading-[1.05] text-[oklch(0.22_0.018_265)]">
        {words.map((w, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ ...LUCID_TWEEN, delay: delay + i * 0.08 }}
            className="inline-block mr-[0.25em]"
          >
            {w}
          </motion.span>
        ))}
      </h2>

      {body && (
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ ...LUCID_TWEEN, delay: delay + words.length * 0.08 + 0.2 }}
          className="font-sans text-base md:text-lg text-[oklch(0.40_0.015_260)] leading-relaxed max-w-xl"
        >
          {body}
        </motion.p>
      )}
    </div>
  );
}

/**
 * A drifting glyph card — a slow-floating chip that decorates the scene.
 */
export function DriftingChip({
  label,
  value,
  className = "",
  delay = 0,
}: {
  label: string;
  value: string;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ ...LUCID_TWEEN, delay }}
      className={`absolute pointer-events-none ${className}`}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="border border-[oklch(0.80_0.014_75)] bg-[oklch(0.95_0.010_75_/_0.7)] backdrop-blur-sm px-4 py-3 rounded-sm shadow-[0_8px_30px_-12px_oklch(0.22_0.018_265_/_0.20)]"
      >
        <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-[oklch(0.50_0.015_260)] mb-1">
          {label}
        </div>
        <div className="font-serif italic text-[oklch(0.62_0.16_35)] text-2xl leading-none">
          {value}
        </div>
      </motion.div>
    </motion.div>
  );
}
