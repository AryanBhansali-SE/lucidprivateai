import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef } from "react";

/**
 * Cinematic backdrop: layered gradient mesh, slow camera-pan,
 * volumetric blooms, mouse parallax + scroll parallax + drifting particles.
 * Pure CSS/SVG — no MP4, fast to render.
 */
export function AtmosphericBackdrop({ scrollTarget }: { scrollTarget?: React.RefObject<HTMLElement | null> }) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 30, damping: 22, mass: 1.4 });
  const sy = useSpring(my, { stiffness: 30, damping: 22, mass: 1.4 });

  useEffect(() => {
    let raf = 0;
    let pendingX = 0;
    let pendingY = 0;
    function handle(e: MouseEvent) {
      pendingX = (e.clientX / window.innerWidth - 0.5) * 2;
      pendingY = (e.clientY / window.innerHeight - 0.5) * 2;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        mx.set(pendingX);
        my.set(pendingY);
        raf = 0;
      });
    }
    window.addEventListener("mousemove", handle, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handle);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [mx, my]);

  const { scrollYProgress } = useScroll(
    scrollTarget ? { target: scrollTarget, offset: ["start start", "end start"] } : undefined
  );
  // Slow "camera" pan — scenes drift past
  const cameraY = useTransform(scrollYProgress, [0, 1], [0, -180]);
  const cameraScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const driftRot = useTransform(scrollYProgress, [0, 1], [0, 18]);

  // Translate motion values to CSS-friendly strings
  const orbAX = useTransform(sx, (v) => `${v * 50}px`);
  const orbAY = useTransform(sy, (v) => `${v * 50}px`);
  const orbBX = useTransform(sx, (v) => `${v * -70}px`);
  const orbBY = useTransform(sy, (v) => `${v * -70}px`);
  const orbCX = useTransform(sx, (v) => `${v * 30}px`);
  const orbCY = useTransform(sy, (v) => `${v * 30}px`);
  const orbDX = useTransform(sx, (v) => `${v * -25}px`);
  const orbDY = useTransform(sy, (v) => `${v * -25}px`);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Vignette base */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 35%, oklch(0.95 0.012 75) 0%, oklch(0.91 0.012 75) 45%, oklch(0.85 0.016 75) 100%)",
        }}
      />

      {/* Camera-panned bloom layer */}
      <motion.div
        className="absolute inset-0"
        style={{ y: cameraY, scale: cameraScale, transformOrigin: "50% 50%" }}
      >
        {/* Coral bloom */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: "65vw",
            height: "65vw",
            left: "8%",
            top: "8%",
            background: "radial-gradient(circle, oklch(0.62 0.16 35 / 0.42), transparent 60%)",
            filter: "blur(70px)",
            x: orbAX,
            y: orbAY,
          }}
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Iris bloom */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: "55vw",
            height: "55vw",
            right: "3%",
            top: "18%",
            background: "radial-gradient(circle, oklch(0.55 0.14 290 / 0.34), transparent 60%)",
            filter: "blur(90px)",
            x: orbBX,
            y: orbBY,
            rotate: driftRot,
          }}
          animate={{ scale: [1.1, 1, 1.1] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Pale gold */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: "50vw",
            height: "50vw",
            left: "28%",
            bottom: "-12%",
            background: "radial-gradient(circle, oklch(0.78 0.12 60 / 0.30), transparent 60%)",
            filter: "blur(80px)",
            x: orbCX,
            y: orbCY,
          }}
          animate={{ scale: [1, 1.18, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Cool sage low orb */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: "40vw",
            height: "40vw",
            right: "20%",
            bottom: "5%",
            background: "radial-gradient(circle, oklch(0.72 0.08 160 / 0.22), transparent 60%)",
            filter: "blur(75px)",
            x: orbDX,
            y: orbDY,
          }}
          animate={{ scale: [1.05, 0.95, 1.05] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Drifting SVG light rays */}
      <LightRays />

      {/* Floating particles */}
      <Particles />

      {/* Film grain overlay */}
      <div
        className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
          backgroundSize: "200px 200px",
        }}
      />

      {/* Hairline grid wash */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.22 0.018 265) 1px, transparent 1px), linear-gradient(90deg, oklch(0.22 0.018 265) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Top + bottom edge fade for cinematic letterbox feel */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[oklch(0.91_0.012_75)] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[oklch(0.91_0.012_75)] to-transparent" />
    </div>
  );
}

function LightRays() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.18]" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="ray" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="oklch(0.95 0.05 75)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="oklch(0.95 0.05 75)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.rect
          key={i}
          x={`${10 + i * 20}%`}
          y="-10%"
          width="6%"
          height="120%"
          fill="url(#ray)"
          style={{ transformOrigin: "center top" }}
          animate={{ rotate: [-8, 8, -8], opacity: [0.3, 0.7, 0.3] }}
          transition={{
            duration: 12 + i * 2,
            delay: i * 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </svg>
  );
}

function Particles() {
  const dots = useRef(
    Array.from({ length: 38 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      d: 8 + Math.random() * 14,
      delay: Math.random() * 8,
      size: 1 + Math.random() * 2.5,
      drift: 20 + Math.random() * 60,
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
            y: [0, -p.drift, 0],
            x: [0, p.drift * 0.4, 0],
            opacity: [0.15, 0.65, 0.15],
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
