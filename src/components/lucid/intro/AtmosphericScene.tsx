import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef } from "react";

/**
 * Drifting orbs + ink-bloom backdrop.
 * Pure presentational. Mouse-parallax + scroll-parallax.
 */
export function AtmosphericBackdrop({ scrollTarget }: { scrollTarget?: React.RefObject<HTMLElement | null> }) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 40, damping: 20, mass: 1.2 });
  const sy = useSpring(my, { stiffness: 40, damping: 20, mass: 1.2 });

  useEffect(() => {
    function handle(e: MouseEvent) {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      mx.set(x);
      my.set(y);
    }
    window.addEventListener("mousemove", handle);
    return () => window.removeEventListener("mousemove", handle);
  }, [mx, my]);

  const { scrollYProgress } = useScroll(
    scrollTarget ? { target: scrollTarget, offset: ["start start", "end start"] } : undefined
  );
  const driftY = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const driftRot = useTransform(scrollYProgress, [0, 1], [0, 30]);

  // Translate motion values to CSS-friendly strings
  const orbAX = useTransform(sx, (v) => `${v * 40}px`);
  const orbAY = useTransform(sy, (v) => `${v * 40}px`);
  const orbBX = useTransform(sx, (v) => `${v * -60}px`);
  const orbBY = useTransform(sy, (v) => `${v * -60}px`);
  const orbCX = useTransform(sx, (v) => `${v * 25}px`);
  const orbCY = useTransform(sy, (v) => `${v * 25}px`);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Vignette base */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, oklch(0.94 0.012 75) 0%, oklch(0.91 0.012 75) 50%, oklch(0.86 0.014 75) 100%)",
        }}
      />

      {/* Coral bloom */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: "60vw",
          height: "60vw",
          left: "10%",
          top: "10%",
          background: "radial-gradient(circle, oklch(0.62 0.16 35 / 0.35), transparent 60%)",
          filter: "blur(60px)",
          x: orbAX,
          y: orbAY,
          translateY: driftY,
        }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Iris bloom */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: "50vw",
          height: "50vw",
          right: "5%",
          top: "20%",
          background: "radial-gradient(circle, oklch(0.55 0.14 290 / 0.30), transparent 60%)",
          filter: "blur(80px)",
          x: orbBX,
          y: orbBY,
          rotate: driftRot,
        }}
        animate={{ scale: [1.1, 1, 1.1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Pale gold low orb */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: "45vw",
          height: "45vw",
          left: "30%",
          bottom: "-10%",
          background: "radial-gradient(circle, oklch(0.78 0.12 60 / 0.25), transparent 60%)",
          filter: "blur(70px)",
          x: orbCX,
          y: orbCY,
        }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating particles */}
      <Particles />

      {/* Hairline grid wash */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.22 0.018 265) 1px, transparent 1px), linear-gradient(90deg, oklch(0.22 0.018 265) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />
    </div>
  );
}

function Particles() {
  const dots = useRef(
    Array.from({ length: 28 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      d: 6 + Math.random() * 10,
      delay: Math.random() * 6,
      size: 1 + Math.random() * 2.5,
    }))
  ).current;

  return (
    <>
      {dots.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: "oklch(0.22 0.018 265 / 0.45)",
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.7, 0.2],
          }}
          transition={{
            duration: p.d,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </>
  );
}
