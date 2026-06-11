import { useRef, useMemo, useState, useEffect } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useReducedMotion,
  useMotionValue,
  useMotionTemplate,
  type MotionValue,
} from "framer-motion";
import { Background } from "./Background";
import { Sparkline } from "./Sparkline";
import { ThemeToggle } from "./ThemeToggle";
import { RESOURCE_BARS, SUMMARY_METRICS, useProviders, type ProviderIntel } from "./data";

const CORNERS: Record<string, { x: number; y: number; cardOffsets: Array<{ x: number; y: number }> }> = {
  aws: { x: -34, y: -28, cardOffsets: [{ x: -22, y: -14 }, { x: -28, y: 8 }, { x: -8, y: -22 }] },
  azure: { x: 34, y: -28, cardOffsets: [{ x: 22, y: -14 }, { x: 28, y: 8 }, { x: 8, y: -22 }] },
  gcp: { x: -34, y: 26, cardOffsets: [{ x: -22, y: 14 }, { x: -28, y: -6 }, { x: -8, y: 22 }] },
  onprem: { x: 34, y: 26, cardOffsets: [{ x: 22, y: 14 }, { x: 28, y: -6 }, { x: 8, y: 22 }] },
};

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return mobile;
}

export function Stage() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const isMobile = useIsMobile();
  const { data: providers, isLoading, isError } = useProviders();
  const [activeGlobe, setActiveGlobe] = useState<string | null>(null);

  const { scrollYProgress } = useScroll({ target: wrapperRef, offset: ["start start", "end end"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });

  const phase1 = useTransform(progress, [0, 0.1], [1, 0]);
  const phaseGlobes = useTransform(progress, [0.06, 0.22], [0, 1]);
  const phaseCards = useTransform(progress, [0.22, 0.5], [0, 1]);
  const phaseConnections = useTransform(progress, [0.4, 0.62], [0, 1]);
  const phaseConverge = useTransform(progress, [0.62, 0.78], [0, 1]);
  const phasePanel = useTransform(progress, [0.78, 0.92], [0, 1]);
  const phaseSummary = useTransform(progress, [0.88, 1], [0, 1]);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const px = useSpring(mx, { stiffness: 80, damping: 20 });
  const py = useSpring(my, { stiffness: 80, damping: 20 });

  function handleMouse(e: React.MouseEvent) {
    if (reduced || isMobile) return;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width - 0.5) * 8);
    my.set(((e.clientY - r.top) / r.height - 0.5) * 8);
  }

  const list: ProviderIntel[] = useMemo(() => providers ?? [], [providers]);
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isMobile) return;
    return px.on("change", (x) => {
      if (parallaxRef.current) parallaxRef.current.style.transform = `translate(${x}px, ${py.get()}px)`;
    });
  }, [isMobile, px, py]);
  useEffect(() => {
    if (isMobile) return;
    return py.on("change", (y) => {
      if (parallaxRef.current) parallaxRef.current.style.transform = `translate(${px.get()}px, ${y}px)`;
    });
  }, [isMobile, px, py]);

  return (
    <div ref={wrapperRef} className="relative" style={{ height: "320vh" }}>
      <div
        onMouseMove={handleMouse}
        className="sticky top-0 h-screen w-full overflow-hidden"
        style={{ isolation: "isolate" }}
      >
        <Background />

        <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-5 sm:px-10">
          <div className="flex items-center gap-2 font-mono text-[11px] tracking-micro uppercase text-[var(--muted-foreground)]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
            Atomity / Visibility Engine
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden font-mono text-[11px] tracking-micro uppercase text-[var(--muted-foreground)] sm:block">
              Cost Gravity
            </div>
            <ThemeToggle />
          </div>
        </header>

        <div
          ref={parallaxRef}
          className="absolute inset-0"
          suppressHydrationWarning
        >
          <SceneCenter progress={progress} phase1={phase1} phasePanel={phasePanel} />
          <ConnectionLayer providers={list} phaseCards={phaseCards} phaseConnections={phaseConnections} phaseConverge={phaseConverge} phasePanel={phasePanel} />
          {list.map((p) => (
            <ProviderNode
              key={p.key}
              provider={p}
              phaseGlobes={phaseGlobes}
              phaseCards={phaseCards}
              phaseConverge={phaseConverge}
              phasePanel={phasePanel}
              activeGlobe={activeGlobe}
              onGlobeTap={setActiveGlobe}
              isMobile={isMobile}
            />
          ))}
          <ResourcePanel phasePanel={phasePanel} phaseSummary={phaseSummary} />
          <SummaryStrip phaseSummary={phaseSummary} />
        </div>

        {isLoading && <LoadingOverlay />}
        {isError && (
          <div className="absolute inset-x-0 bottom-8 z-40 mx-auto w-fit rounded-full glass-panel px-4 py-2 font-mono text-[11px] tracking-micro uppercase text-[var(--destructive)]">
            Intelligence stream unavailable · retry
          </div>
        )}

        <ScrollHint progress={progress} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── Center ──── */

function SceneCenter({ progress, phase1, phasePanel }: {
  progress: MotionValue<number>;
  phase1: MotionValue<number>;
  phasePanel: MotionValue<number>;
}) {
  const scale = useTransform(progress, [0, 0.62, 0.78, 1], [1, 1.04, 1.15, 1]);
  const brightness = useTransform(progress, [0.6, 0.78], [1, 1.4]);
  const coreOpacity = useTransform(phasePanel, [0, 1], [1, 0.25]);
  const filter = useMotionTemplate`brightness(${brightness})`;

  return (
    // Added pointer-events-none here to stop center layout elements from trapping mouse vectors
    <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
      <motion.div
        className="absolute left-1/2 top-1/2 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--glass-border)]"
        animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.15, 0.4] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.svg
        className="absolute left-1/2 top-1/2 h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2"
        viewBox="-100 -100 200 200"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      >
        <circle cx="0" cy="0" r="92" fill="none" stroke="var(--glass-border)" strokeWidth="0.5" />
        {Array.from({ length: 48 }).map((_, i) => {
          const a = (i * Math.PI * 2) / 48;
          const cos = parseFloat(Math.cos(a).toFixed(5));
          const sin = parseFloat(Math.sin(a).toFixed(5));
          const r1 = 88;
          const r2 = i % 6 === 0 ? 78 : 84;
          return (
            <line key={i}
              x1={cos * r1} y1={sin * r1} x2={cos * r2} y2={sin * r2}
              stroke="oklch(0.82 0.13 80)"
              strokeOpacity={i % 6 === 0 ? 0.9 : 0.35}
              strokeWidth="0.8"
            />
          );
        })}
      </motion.svg>

      <motion.div
        style={{ scale, filter, opacity: coreOpacity }}
        className="relative flex h-[140px] w-[140px] items-center justify-center rounded-full core-sphere"
      >
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative z-10 text-center">
          <div className="font-display text-[22px] font-medium tracking-wide text-[var(--primary-foreground)]">Atomity</div>
          <div className="mt-0.5 font-mono text-[8px] tracking-micro uppercase text-[var(--primary-foreground)]/70">Visibility Core</div>
        </div>
      </motion.div>

      <motion.div
        style={{ opacity: phase1 }}
        className="pointer-events-none absolute left-1/2 top-[200px] w-[min(560px,90vw)] -translate-x-1/2 text-center"
      >
        <p className="font-mono text-[10px] tracking-micro uppercase text-[var(--muted-foreground)]">
          Unified Infrastructure Visibility
        </p>
        <h1 className="mt-3 font-display text-balance text-[clamp(28px,4vw,52px)] font-light leading-[1.05] text-[var(--foreground)]">
          Many cloud systems.<br />
          <span className="italic text-[var(--primary)]">One plane of visibility.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm text-[var(--muted-foreground)]">
          Scroll to watch every signal across your providers converge into a single source of truth.
        </p>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────── Provider node ──── */

function ProviderNode({
  provider, phaseGlobes, phaseCards, phaseConverge, phasePanel,
  activeGlobe, onGlobeTap, isMobile,
}: {
  provider: ProviderIntel;
  phaseGlobes: MotionValue<number>;
  phaseCards: MotionValue<number>;
  phaseConverge: MotionValue<number>;
  phasePanel: MotionValue<number>;
  activeGlobe: string | null;
  onGlobeTap: (key: string | null) => void;
  isMobile: boolean;
}) {
  const corner = CORNERS[provider.key];

  const startX = isMobile ? (corner.x > 0 ? 26 : -26) : corner.x;
  const endX = isMobile ? (corner.x > 0 ? 18 : -18) : corner.x * 0.55;
  const startY = isMobile ? (corner.y > 0 ? 22 : -22) : corner.y;
  const endY = isMobile ? (corner.y > 0 ? 14 : -14) : corner.y * 0.55;

  const convergeX = useTransform(phaseConverge, [0, 1], [startX, endX]);
  const convergeY = useTransform(phaseConverge, [0, 1], [startY, endY]);

  const opacity = useTransform(phaseGlobes, [0, 1], [0, 1]);
  const _scale = useTransform(phaseGlobes, [0, 1], [0.7, 1]);
  const scale = isMobile ? 1 : _scale;

  const mDx = isMobile ? (corner.x > 0 ? 15 : -15) : (corner.x > 0 ? 30 : -30);
  const mDy = isMobile ? (corner.y > 0 ? 15 : -15) : (corner.y > 0 ? 30 : -30);
  const entranceX = useTransform(phaseGlobes, [0, 1], [mDx, 0]);
  const entranceY = useTransform(phaseGlobes, [0, 1], [mDy, 0]);

  const finalX = useMotionTemplate`calc(-50% + ${convergeX}vw + ${entranceX}vw)`;
  const finalY = useMotionTemplate`calc(-50% + ${convergeY}vh + ${entranceY}vh)`;
  const panelFade = useTransform(phasePanel, [0, 1], [1, 0.25]);

  const combinedOp = useTransform(
    [opacity, panelFade] as MotionValue[],
    (vals) => isMobile ? 1 : (vals as number[])[0] * (vals as number[])[1]
  );
  const scaleVal = isMobile ? 1 : scale;
  const isActive = activeGlobe === provider.key;

  const globeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = globeRef.current;
    if (!el) return;

    const syncStyleState = () => {
      const currentScale = typeof scaleVal === "number" ? scaleVal : (scaleVal as MotionValue<number>).get();
      el.style.transform = `translate(${finalX.get()}, ${finalY.get()}) scale(${currentScale})`;
    };

    syncStyleState();

    const unsubs = [
      finalX.on("change", syncStyleState),
      finalY.on("change", syncStyleState),
      combinedOp.on("change", (v) => { el.style.opacity = String(v); }),
    ];
    el.style.opacity = String(combinedOp.get());
    return () => unsubs.forEach((u) => u());
  }, [finalX, finalY, scaleVal, combinedOp]);

  const handleToggle = () => {
    onGlobeTap(isActive ? null : provider.key);
  };

  return (
    <>
      <div
        ref={globeRef}
        data-provider={provider.key}
        className="absolute left-1/2 top-1/2"
        style={{ zIndex: isActive ? 50 : 30, opacity: isMobile ? 1 : 0 }}
      >
        {/* Desktop Rendering Flow */}
        <div className="hidden md:block">
          <GlassGlobe
            provider={provider}
            isActive={isActive}
            onTap={handleToggle}
          />
        </div>

        {/* Mobile Isolated Structural Bounding Container */}
        <div className="block md:hidden relative w-[clamp(88px,21vw,170px)] h-[clamp(88px,21vw,170px)]" aria-label="Provider intelligence grid" >
          <GlassGlobe
            provider={provider}
            isActive={isActive}
            onTap={handleToggle}
          />
          <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-50">
            <MobileInlineCards
              provider={provider}
              isOpen={isActive}
            />
          </div>
        </div>
      </div>

      {/* Desktop Orbital Coordinates (Untouched) */}
      {provider.cards.slice(0, 3).map((card, i) => {
        const offset = corner.cardOffsets[i];
        return (
          <Card
            key={card.id}
            providerKey={provider.key}
            cardId={card.id}
            card={card}
            baseX={corner.x + offset.x}
            baseY={corner.y + offset.y}
            index={i}
            phaseCards={phaseCards}
            phaseConverge={phaseConverge}
            phasePanel={phasePanel}
          />
        );
      })}
    </>
  );
}

/* ─────────────────────────────── Mobile Inline Structural Stack ──── */

function MobileInlineCards({
  provider,
  isOpen,
}: {
  provider: ProviderIntel;
  isOpen: boolean;
}) {
  return (
    <div
      className="overflow-hidden transition-all duration-300 ease-out"
      style={{
        maxHeight: isOpen ? "500px" : "0px",
        opacity: isOpen ? 1 : 0,
        visibility: isOpen ? "visible" : "hidden",
        transform: isOpen ? "translateY(0px)" : "translateY(-6px)",
        transition: isOpen
          ? "max-height 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease-out, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
          : "max-height 0.2s ease-in, opacity 0.15s ease-in, transform 0.15s ease-in, visibility 0s 0.2s",
      }}
      aria-hidden={!isOpen}
    >
      <div
        className="flex flex-col gap-2 p-0.5"
        style={{
          width: "clamp(160px, 44vw, 210px)",
        }}
      >
        {provider.cards.slice(0, 3).map((card, i) => (
          <div
            key={card.id}
            style={{
              transitionDelay: isOpen ? `${i * 0.04}s` : "0s",
              transition: "opacity 0.2s ease-out, transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              opacity: isOpen ? 1 : 0,
              transform: isOpen ? "none" : "translateY(4px)",
            }}
          >
            <MobileInlineCardInner card={card} providerKey={provider.key} />
          </div>
        ))}
      </div>
    </div>
  );
}

function MobileInlineCardInner({
  card,
  providerKey,
}: {
  card: ProviderIntel["cards"][number];
  providerKey: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        setExpanded((v) => !v);
      }}
      className="w-full cursor-pointer select-none rounded-xl glass-panel px-3 py-2.5 transition-colors hover:border-[var(--primary)]/40"
      style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
    >
      <div className="flex items-center justify-between font-mono text-[8px] tracking-micro uppercase text-[var(--muted-foreground)]">
        <span className="truncate max-w-[80%]">{card.title}</span>
        <div className="flex items-center gap-1">
          <StatusDot status={card.status} />
          <span className={`inline-block transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>▾</span>
        </div>
      </div>
      <div className="mt-1 flex items-end justify-between">
        <div className="font-display text-base font-medium leading-none text-[var(--foreground)]">{card.metric}</div>
        <Sparkline data={card.spark} className="h-3.5 w-9 text-[var(--primary)]" />
      </div>

      {expanded && (
        <div className="mt-2 border-t border-[var(--glass-border)] pt-2">
          <dl className="grid grid-cols-2 gap-y-1 text-[8px] font-mono text-[var(--muted-foreground)]">
            <dt>Src</dt>
            <dd className="text-right text-[var(--foreground)] uppercase">{providerKey}</dd>
            <dt>24h</dt>
            <dd className="text-right text-[var(--primary)]">
              {card.spark.at(-1)! > card.spark[0] ? "▲" : "▼"} {Math.abs(card.spark.at(-1)! - card.spark[0])}%
            </dd>
          </dl>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────── Interactive Globes ──── */

function GlassGlobe({ provider, isActive, onTap }: {
  provider: ProviderIntel;
  isActive: boolean;
  onTap: () => void;
}) {
  const regionShort = provider.region.split(/[·,]/)[0].trim();

  return (
    <div
      className="relative rounded-full glass-panel transition-shadow duration-300"
      style={{
        width: "clamp(88px, 21vw, 170px)",
        height: "clamp(88px, 21vw, 170px)",
        background: "radial-gradient(circle at 30% 25%, color-mix(in oklab, var(--primary) 22%, transparent), color-mix(in oklab, var(--card) 90%, transparent) 60%, color-mix(in oklab, var(--background-deep) 90%, transparent))",
        boxShadow: isActive ? "0 0 0 2.5px var(--primary), var(--shadow-elegant)" : "var(--shadow-elegant)",
      }}
    >
      <div className="pointer-events-none absolute inset-2 rounded-full border border-[var(--glass-border)]" />
      <div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{ background: "radial-gradient(ellipse at 30% 20%, color-mix(in oklab, white 18%, transparent), transparent 45%)" }}
      />

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onTap();
        }}
        aria-label={`Toggle ${provider.name} signals`}
        aria-expanded={isActive}
        className="absolute inset-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] z-20"
        style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
      />

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-2 text-center z-10">
        <div className="hidden font-mono text-[8px] leading-tight tracking-micro uppercase text-[var(--muted-foreground)] sm:block">
          {provider.region}
        </div>
        <div className="block w-full truncate px-1 text-center font-mono text-[7px] leading-tight tracking-micro uppercase text-[var(--muted-foreground)] sm:hidden">
          {regionShort}
        </div>
        <div className="mt-0.5 font-display text-[clamp(12px,3.6vw,24px)] font-medium leading-tight text-[var(--foreground)]">
          {provider.name}
        </div>
        <div className="mt-0.5 font-mono text-[clamp(8px,2vw,11px)] text-[var(--primary)]">
          ${(provider.monthlyCost / 1000).toFixed(1)}k/mo
        </div>
        <div className="mt-1 hidden items-center gap-1.5 text-[9px] text-[var(--muted-foreground)] sm:flex">
          <span>util {provider.utilization}%</span>
          <span className="h-0.5 w-0.5 rounded-full bg-[var(--muted-foreground)]" />
          <span>{provider.instances} inst</span>
        </div>
        <div
          className="mt-0.5 font-mono text-[7px] tracking-micro uppercase text-[var(--primary)]/60 md:hidden animate-pulse"
          style={{
            opacity: isActive ? 0 : 1,
            transition: "opacity 0.15s",
          }}
        >
          tap
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────── Desktop Card ──── */

function Card({
  providerKey, cardId, card, baseX, baseY, index,
  phaseCards, phaseConverge, phasePanel,
}: {
  providerKey: string;
  cardId: string;
  card: ProviderIntel["cards"][number];
  baseX: number;
  baseY: number;
  index: number;
  phaseCards: MotionValue<number>;
  phaseConverge: MotionValue<number>;
  phasePanel: MotionValue<number>;
}) {
  const [expanded, setExpanded] = useState(false);
  const start = 0.15 + index * 0.18;
  const end = clamp(start + 0.3, 0, 1);
  const localReveal = useTransform(phaseCards, [start, end], [0, 1]);
  const desktopOp = useTransform(localReveal, [0, 1], [0, 1]);
  const fade = useTransform(phasePanel, [0, 1], [1, 0]);
  const cx = useTransform(phaseConverge, [0, 1], [baseX, baseX * 0.35]);
  const cy = useTransform(phaseConverge, [0, 1], [baseY, baseY * 0.35]);
  const scale = useTransform(localReveal, [0, 1], [0.85, 1]);
  const x = useMotionTemplate`calc(-50% + ${cx}vw)`;
  const y = useMotionTemplate`calc(-50% + ${cy}vh)`;

  // Added conditional hit-box toggling for hidden desktop panels
  const cardEvents = useTransform(desktopOp, (v) => v > 0.4 ? "auto" : "none");

  return (
    <motion.div
      data-card-source={providerKey}
      data-card-id={cardId}
      className="absolute left-1/2 top-1/2 hidden md:block"
      style={{ x, y, scale, zIndex: 35, pointerEvents: cardEvents }}
    >
      <motion.div style={{ opacity: useMotionTemplate`calc(${desktopOp} * ${fade})` }}>
        <CardInner
          card={card}
          providerKey={providerKey}
          expanded={expanded}
          setExpanded={setExpanded}
        />
      </motion.div>
    </motion.div>
  );
}

function CardInner({ card, providerKey, expanded, setExpanded }: {
  card: ProviderIntel["cards"][number];
  providerKey: string;
  expanded: boolean;
  setExpanded: (v: boolean | ((p: boolean) => boolean)) => void;
}) {
  return (
    <div
      onClick={() => setExpanded((v) => !v)}
      className="w-[200px] cursor-pointer select-none rounded-xl glass-panel px-3.5 py-3 hover:border-[var(--primary)]/50"
    >
      <div className="flex items-center justify-between font-mono text-[9px] tracking-micro uppercase text-[var(--muted-foreground)]">
        <span>{card.title}</span>
        <div className="flex items-center gap-1.5">
          <StatusDot status={card.status} />
          <span className={`inline-block text-[var(--muted-foreground)] transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>▾</span>
        </div>
      </div>
      <div className="mt-1.5 flex items-end justify-between">
        <div className="font-display text-[22px] font-medium leading-none text-[var(--foreground)]">{card.metric}</div>
        <Sparkline data={card.spark} className="h-5 w-14 text-[var(--primary)]" />
      </div>
      <div className="mt-1.5 text-[10px] text-[var(--muted-foreground)]">{card.status}</div>

      {expanded && (
        <div className="mt-2.5 border-t border-[var(--glass-border)] pt-2">
          <dl className="grid grid-cols-2 gap-y-1.5 text-[10px]">
            <dt className="text-[var(--muted-foreground)]">Source</dt>
            <dd className="text-right font-mono uppercase text-[var(--foreground)]">{providerKey}</dd>
            <dt className="text-[var(--muted-foreground)]">Trend 24h</dt>
            <dd className="text-right text-[var(--primary)]">
              {card.spark.at(-1)! > card.spark[0] ? "▲" : "▼"} {Math.abs(card.spark.at(-1)! - card.spark[0])}%
            </dd>
            <dt className="text-[var(--muted-foreground)]">Signal</dt>
            <dd className="text-right text-[var(--foreground)]">live · 5s</dd>
          </dl>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
            className="mt-2 w-full rounded-md border border-[var(--glass-border)] py-1 font-mono text-[9px] tracking-micro uppercase text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            Collapse
          </button>
        </div>
      )}
    </div>
  );
}

function StatusDot({ status }: { status: ProviderIntel["cards"][number]["status"] }) {
  const color =
    status === "Healthy" ? "var(--primary)" :
      status === "Recoverable" ? "oklch(0.78 0.12 65)" :
        status === "Saturated" ? "var(--destructive)" :
          "oklch(0.7 0.08 75)";
  return <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: color }} />;
}

/* ──────────────────────────────────────── Connections ──── */

function ConnectionLayer({ providers, phaseCards, phaseConnections, phaseConverge, phasePanel }: {
  providers: ProviderIntel[];
  phaseCards: MotionValue<number>;
  phaseConnections: MotionValue<number>;
  phaseConverge: MotionValue<number>;
  phasePanel: MotionValue<number>;
}) {
  const reduced = useReducedMotion();
  const opacity = useTransform(phaseConnections, [0, 1], [0, 1]);
  const panelFade = useTransform(phasePanel, [0, 1], [1, 0]);
  const pathLen = useTransform(phaseConnections, [0, 1], [0, 1]);

  return (
    <motion.svg
      className="pointer-events-none absolute inset-0 z-10"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ opacity: useMotionTemplate`calc(${opacity} * ${panelFade})` }}
    >
      <defs>
        <linearGradient id="stroke" x1="0" x2="1">
          <stop offset="0%" stopColor="oklch(0.82 0.13 80)" stopOpacity="0.05" />
          <stop offset="50%" stopColor="oklch(0.82 0.13 80)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="oklch(0.82 0.13 80)" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      {providers.map((p) => {
        const c = CORNERS[p.key];
        const gx = 50 + c.x, gy = 50 + c.y;
        return (
          <g key={p.key}>
            <motion.path
              d={`M ${gx} ${gy} Q ${(gx + 50) / 2 + (c.x > 0 ? -8 : 8)} ${(gy + 50) / 2} 50 50`}
              fill="none" stroke="url(#stroke)" strokeWidth="0.18"
              style={{ pathLength: reduced ? 1 : pathLen }}
            />
            {p.cards.slice(0, 3).map((card, i) => {
              const off = c.cardOffsets[i];
              return (
                <motion.path key={card.id}
                  d={`M ${50 + c.x + off.x} ${50 + c.y + off.y} L ${gx} ${gy}`}
                  fill="none" stroke="url(#stroke)" strokeWidth="0.15" strokeDasharray="0.6 0.8"
                  style={{ pathLength: reduced ? 1 : phaseCards }}
                />
              );
            })}
          </g>
        );
      })}
      {!reduced && providers.map((p, i) => {
        const c = CORNERS[p.key];
        const gx = 50 + c.x, gy = 50 + c.y;
        return (
          <motion.circle key={p.key} r="0.35" fill="oklch(0.9 0.16 85)"
            initial={{ cx: gx, cy: gy }}
            animate={{ cx: [gx, 50], cy: [gy, 50] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
          />
        );
      })}
    </motion.svg>
  );
}

/* ──────────────────────────────────── Resource panel ──── */

function ResourcePanel({ phasePanel, phaseSummary }: {
  phasePanel: MotionValue<number>;
  phaseSummary: MotionValue<number>;
}) {
  const opacity = useTransform(phasePanel, [0, 0.5, 1], [0, 0.4, 1]);
  const y = useTransform(phasePanel, [0, 1], [40, 0]);
  const summaryShift = useTransform(phaseSummary, [0, 1], [0, -50]);
  const yTotal = useTransform(
    [y, summaryShift] as MotionValue[],
    (vals) => `calc(-50% + ${(vals as number[])[0] + (vals as number[])[1]}px)`
  );

  // Dynamic hit-testing toggles off pointer events unless the panel is fully scrolled into view
  const panelEvents = useTransform(phasePanel, (v) => v > 0.82 ? "auto" : "none");

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 z-30 w-[min(680px,88vw)] -translate-x-1/2"
      style={{ opacity, y: yTotal, pointerEvents: panelEvents }}
    >
      <div className="rounded-2xl glass-panel p-4 sm:p-6 md:p-7" style={{ boxShadow: "var(--shadow-elegant)" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-[10px] tracking-micro uppercase text-[var(--muted-foreground)]">Unified View</div>
            <h2 className="mt-1 font-display text-xl font-medium text-[var(--foreground)] sm:text-2xl">Resource Utilization</h2>
          </div>
          <div className="hidden font-mono text-[10px] tracking-micro uppercase text-[var(--muted-foreground)] sm:block">4 providers · live</div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {RESOURCE_BARS.map((bar, i) => (
            <ResourceBar key={bar.key} bar={bar} phasePanel={phasePanel} index={i} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function ResourceBar({ bar, phasePanel, index }: {
  bar: typeof RESOURCE_BARS[number];
  phasePanel: MotionValue<number>;
  index: number;
}) {
  const start = 0.2 + index * 0.08;
  const end = clamp(start + 0.4, 0, 1);
  const fill = useTransform(phasePanel, [start, end], [0, bar.utilization]);
  const width = useMotionTemplate`${fill}%`;

  return (
    <div className="group rounded-xl border border-[var(--glass-border)] bg-[color-mix(in_oklab,var(--card)_60%,transparent)] p-2.5 sm:p-3 transition-colors hover:border-[var(--primary)]/40">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[10px] tracking-micro uppercase text-[var(--muted-foreground)]">{bar.key}</span>
        <span className="font-display text-base font-medium text-[var(--foreground)]">{bar.utilization}%</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)]">
        <motion.div
          className="h-full rounded-full"
          style={{ width, background: "linear-gradient(90deg, var(--primary), var(--primary-glow))" }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[10px] text-[var(--muted-foreground)]">
        <span>${bar.cost.toLocaleString()}/mo</span>
        <span className="text-[var(--primary)]">−${bar.savings.toLocaleString()} recoverable</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────── Summary strip ──── */

function SummaryStrip({ phaseSummary }: { phaseSummary: MotionValue<number> }) {
  const opacity = useTransform(phaseSummary, [0, 1], [0, 1]);
  const y = useTransform(phaseSummary, [0, 1], [20, 0]);

  // Dynamic hit-testing toggles off pointer events unless the metric line is fully active
  const summaryEvents = useTransform(phaseSummary, (v) => v > 0.82 ? "auto" : "none");

  return (
    <motion.div
      style={{ opacity, y, pointerEvents: summaryEvents }}
      className="absolute inset-x-0 bottom-4 z-30 mx-auto flex w-fit max-w-[92vw] flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-2xl glass-panel px-4 py-2.5 sm:bottom-8 sm:gap-x-8 sm:rounded-full sm:px-5 sm:py-3"
    >
      {SUMMARY_METRICS.map((m) => <CountUp key={m.label} metric={m} progress={phaseSummary} />)}
    </motion.div>
  );
}

function CountUp({ metric, progress }: {
  metric: typeof SUMMARY_METRICS[number];
  progress: MotionValue<number>;
}) {
  const animated = useTransform(progress, [0, 1], [0, metric.value]);
  const display = useTransform(animated, (v) =>
    `${metric.prefix ?? ""}${Math.round(v).toLocaleString()}${metric.suffix ?? ""}`
  );
  return (
    <div className="flex flex-col items-center text-center">
      <motion.span className="font-display text-base font-medium text-[var(--foreground)] sm:text-lg">{display}</motion.span>
      <span className="font-mono text-[8px] tracking-micro uppercase text-[var(--muted-foreground)] sm:text-[9px]">{metric.label}</span>
    </div>
  );
}

/* ─────────────────────────────────── Scroll hint ──── */

function ScrollHint({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, [0, 0.05, 0.15], [1, 1, 0]);
  return (
    <motion.div
      style={{ opacity }}
      className="absolute inset-x-0 bottom-6 z-30 mx-auto flex w-fit items-center gap-2 font-mono text-[10px] tracking-micro uppercase text-[var(--muted-foreground)]"
    >
      <span>Scroll to converge</span>
      <motion.span animate={{ y: [0, 4, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>↓</motion.span>
    </motion.div>
  );
}

function LoadingOverlay() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-20 z-40 mx-auto w-fit rounded-full glass-panel px-4 py-2 font-mono text-[10px] tracking-micro uppercase text-[var(--muted-foreground)]">
      <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--primary)]" /> calibrating signal
    </div>
  );
}