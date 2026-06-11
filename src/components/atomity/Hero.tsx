import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import { ThemeToggle } from "./ThemeToggle";

// Chips kept in a safe inner zone — min 14% from edges so -translate-x-1/2 never clips
const PROVIDERS = [
  { label: "AWS", x: "18%", y: "20%", d: 0.05 },
  { label: "Azure", x: "78%", y: "16%", d: 0.15 },
  { label: "GCP", x: "20%", y: "78%", d: 0.25 },
  { label: "On-Prem", x: "80%", y: "80%", d: 0.35 },
  { label: "Kubernetes", x: "50%", y: "8%", d: 0.45 },
  { label: "Snowflake", x: "14%", y: "50%", d: 0.55 },
  { label: "Databricks", x: "86%", y: "50%", d: 0.65 },
  { label: "Edge", x: "50%", y: "92%", d: 0.75 },
];

const SIGNALS = ["CPU", "GPU", "RAM", "I/O", "$/hr", "kW", "p95", "QPS"];

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const p = useSpring(scrollYProgress, { stiffness: 140, damping: 32, mass: 0.4 });

  const titleY = useTransform(p, [0, 1], [0, -120]);
  const titleOp = useTransform(p, [0, 0.7, 1], [1, 0.6, 0]);
  const bgScale = useTransform(p, [0, 1], [1, 1.25]);
  const ringRot = useTransform(p, [0, 1], [0, 90]);
  const convergence = useTransform(p, [0, 1], [0, 1]);

  return (
    <section
      ref={ref}
      className="relative h-[180vh] w-full"
      aria-label="Atomity hero"
    >
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">

        {/* ── Theme toggle fixed top-right ── */}
        <div className="absolute right-4 top-4 z-50 sm:right-6 sm:top-5">
          <ThemeToggle />
        </div>

        {/* gradient backdrop */}
        <motion.div style={{ scale: bgScale }} className="absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 50% 35%, color-mix(in oklab, var(--primary) 22%, transparent) 0%, transparent 55%)",
            }}
          />
          <svg className="absolute inset-0 h-full w-full opacity-40">
            <defs>
              <pattern id="dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="color-mix(in oklab, var(--foreground) 18%, transparent)" />
              </pattern>
              <radialGradient id="dotsFade" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="white" stopOpacity="1" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </radialGradient>
              <mask id="dotMask">
                <rect width="100%" height="100%" fill="url(#dotsFade)" />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" mask="url(#dotMask)" />
          </svg>
        </motion.div>

        {/* orbital rings */}
        <motion.div
          style={{ rotate: ringRot }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          {[280, 380, 480, 580].map((size, i) => (
            <motion.div
              key={size}
              className="absolute left-1/2 top-1/2 rounded-full border"
              style={{
                width: size,
                height: size,
                marginLeft: -size / 2,
                marginTop: -size / 2,
                borderColor: "color-mix(in oklab, var(--primary) 22%, transparent)",
              }}
              animate={reduced ? undefined : { rotate: i % 2 === 0 ? 360 : -360 }}
              transition={{ duration: 80 + i * 30, repeat: Infinity, ease: "linear" }}
            />
          ))}
        </motion.div>

        {/* converging provider chips */}
        {PROVIDERS.map((pv, i) => (
          <ProviderChip
            key={pv.label}
            pv={pv}
            index={i}
            convergence={convergence}
            reduced={!!reduced}
          />
        ))}

        {/* central core */}
        <motion.div
          className="relative z-20 flex h-32 w-32 items-center justify-center rounded-full core-sphere sm:h-44 sm:w-44"
          animate={reduced ? undefined : { scale: [1, 1.04, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="text-center">
            <div className="font-mono text-[8px] tracking-micro uppercase text-[var(--primary-foreground)]/80 sm:text-[9px]">
              Atomity
            </div>
            <div className="mt-1 font-display text-lg font-medium text-[var(--primary-foreground)] sm:text-2xl">
              Core
            </div>
          </div>
        </motion.div>

        {/* scanning signals — hidden on mobile to reduce clutter */}
        {!reduced &&
          SIGNALS.map((s, i) => (
            <motion.div
              key={s}
              className="pointer-events-none absolute z-10 hidden font-mono text-[10px] tracking-micro uppercase text-[var(--primary)]/60 sm:block"
              style={{
                left: `${15 + ((i * 11) % 70)}%`,
                top: `${20 + ((i * 17) % 60)}%`,
              }}
              animate={{ opacity: [0, 0.9, 0], y: [10, -10, 10] }}
              transition={{ duration: 4 + i * 0.3, repeat: Infinity, delay: i * 0.4 }}
            >
              {s}
            </motion.div>
          ))}

        {/* TITLE */}
        <motion.div
          style={{ y: titleY, opacity: titleOp }}
          className="pointer-events-none absolute inset-x-0 top-[10vh] z-10 flex flex-col items-center px-5 text-center sm:top-[14vh] sm:z-30"
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="inline-flex items-center gap-2 rounded-full glass-panel px-3 py-1.5 font-mono text-[9px] tracking-micro uppercase text-[var(--muted-foreground)] sm:text-[10px]"
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
            Visibility Engine · v2026
          </motion.div>

          <h1 className="mt-4 font-display text-balance text-[clamp(28px,6vw,96px)] font-light leading-[1.0] text-[var(--foreground)] sm:mt-6 sm:leading-[0.98]">
            <AnimatedWord delay={0.15}>Many</AnimatedWord>{" "}
            <AnimatedWord delay={0.25}>clouds.</AnimatedWord>
            <br />
            <span className="italic text-[var(--primary)]">
              <AnimatedWord delay={0.4}>One</AnimatedWord>{" "}
              <AnimatedWord delay={0.5}>plane.</AnimatedWord>
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="mx-auto mt-4 max-w-xs text-sm text-[var(--muted-foreground)] sm:max-w-lg sm:mt-6 sm:text-base"
          >
            Atomity unifies every provider, every signal, every cost dimension into a single
            source of truth — so your infrastructure tells you what it costs before it costs you.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.8 }}
            className="mt-6 flex flex-col items-center gap-2 font-mono text-[9px] tracking-micro uppercase text-[var(--muted-foreground)] sm:mt-10 sm:text-[10px]"
          >
            <span>Scroll to converge</span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="h-6 w-px bg-gradient-to-b from-[var(--primary)] to-transparent"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function AnimatedWord({ children, delay }: { children: string; delay: number }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 30, filter: "blur(12px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      className="inline-block"
    >
      {children}
    </motion.span>
  );
}

function ProviderChip({
  pv,
  index,
  convergence,
  reduced,
}: {
  pv: (typeof PROVIDERS)[number];
  index: number;
  convergence: ReturnType<typeof useSpring>;
  reduced: boolean;
}) {
  const xNum = parseFloat(pv.x) / 100;
  const yNum = parseFloat(pv.y) / 100;
  const dx = (0.5 - xNum) * (typeof window === "undefined" ? 1200 : window.innerWidth);
  const dy = (0.5 - yNum) * (typeof window === "undefined" ? 800 : window.innerHeight);
  const x = useTransform(convergence, [0, 1], [0, dx]);
  const y = useTransform(convergence, [0, 1], [0, dy]);
  const opacity = useTransform(convergence, [0, 0.7, 1], [1, 0.5, 0]);
  const scale = useTransform(convergence, [0, 1], [1, 0.4]);

  // Clamp position so pill never touches viewport edge
  // The chip is centered via -translate-x/y-1/2, pill width ~100px max
  // We use clamp in CSS via the x/y percentage itself (already adjusted in PROVIDERS array)

  return (
    <motion.div
      className="absolute z-20"
      style={{ left: pv.x, top: pv.y, x, y, opacity, scale }}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: pv.d, duration: 0.7, ease: "easeOut" }}
    >
      {/* -translate centers the pill on the anchor point */}
      <div className="-translate-x-1/2 -translate-y-1/2">
        <motion.div
          animate={reduced ? undefined : { y: [0, -5, 0] }}
          transition={{
            duration: 4 + index * 0.4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.2,
          }}
          className="flex items-center gap-1.5 rounded-full glass-panel px-2.5 py-1 sm:gap-2 sm:px-3 sm:py-1.5"
        >
          <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
          <span className="whitespace-nowrap font-mono text-[9px] tracking-micro uppercase text-[var(--foreground)] sm:text-[10px]">
            {pv.label}
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}