import { useState } from "react";
import {
  motion,
  AnimatePresence,
  useTransform,
  useMotionTemplate,
  type MotionValue,
} from "framer-motion";
import { Sparkline } from "./Sparkline";
import { StatusBadge } from "./StatusBadge";
import type { ProviderIntel } from "./data";

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

interface MetricCardProps {
  providerKey: string;
  cardId: string;
  card: ProviderIntel["cards"][number];
  baseX: number;
  baseY: number;
  index: number;
  phaseCards: MotionValue<number>;
  phaseConverge: MotionValue<number>;
  phasePanel: MotionValue<number>;
}

export function MetricCard({
  providerKey,
  cardId,
  card,
  baseX,
  baseY,
  index,
  phaseCards,
  phaseConverge,
  phasePanel,
}: MetricCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Stagger reveal: each card occupies a sub-range of phaseCards
  const start = 0.15 + index * 0.18;
  const end = clamp(start + 0.3, 0, 1);
  const localReveal = useTransform(phaseCards, [start, end], [0, 1]);
  const opacity = useTransform(localReveal, [0, 1], [0, 1]);
  const scale = useTransform(localReveal, [0, 1], [0.85, 1]);


  const cx = useTransform(phaseConverge, [0, 1], [baseX, baseX * 0.35]);
  const cy = useTransform(phaseConverge, [0, 1], [baseY, baseY * 0.35]);

  const fade = useTransform(phasePanel, [0, 1], [1, 0]);

  const x = useMotionTemplate`calc(-50% + ${cx}vw)`;
  const y = useMotionTemplate`calc(-50% + ${cy}vh)`;

  return (
    <motion.div
      data-card-source={providerKey}
      data-card-id={cardId}
      className="absolute left-1/2 top-1/2 z-20  md:block"
      style={{ x, y, opacity: useMotionTemplate`calc(${opacity} * ${fade})`, scale }}
    >
      <motion.div
        layout
        onClick={() => setExpanded((v) => !v)}
        whileHover={{ y: -3 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        aria-expanded={expanded}
        role="button"
        tabIndex={0}
        aria-label={`${card.title} — ${card.metric}, status: ${card.status}. Click to ${expanded ? "collapse" : "expand"}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
        className="w-[200px] cursor-pointer rounded-xl glass-panel px-3.5 py-3 hover:border-[var(--color-accent-primary)]/50"
      >
        <motion.div
          layout="position"
          className="flex items-center justify-between font-mono text-[9px] tracking-micro uppercase text-[var(--color-text-secondary)]"
        >
          <span>{card.title}</span>
          <div className="flex items-center gap-1.5">
            <StatusBadge status={card.status} />
            <motion.span
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.25 }}
              className="text-[var(--color-text-secondary)]"
              aria-hidden="true"
            >
              ▾
            </motion.span>
          </div>
        </motion.div>

        <motion.div layout="position" className="mt-1.5 flex items-end justify-between">
          <div className="font-display text-[22px] font-medium leading-none text-[var(--color-text-primary)]">
            {card.metric}
          </div>
          <Sparkline data={card.spark} className="h-5 w-14 text-[var(--color-accent-primary)]" />
        </motion.div>

        <motion.div layout="position" className="mt-1.5 text-[10px] text-[var(--color-text-secondary)]">
          {card.status}
        </motion.div>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="details"
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 10 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-[var(--glass-border)] pt-2"
            >
              <dl className="grid grid-cols-2 gap-y-1.5 text-[10px]">
                <dt className="text-[var(--color-text-secondary)]">Source</dt>
                <dd className="text-right font-mono text-[var(--color-text-primary)] uppercase">
                  {providerKey}
                </dd>
                <dt className="text-[var(--color-text-secondary)]">Trend 24h</dt>
                <dd className="text-right text-[var(--color-accent-primary)]">
                  {card.spark.at(-1)! > card.spark[0] ? "▲" : "▼"}{" "}
                  {Math.abs(card.spark.at(-1)! - card.spark[0])}%
                </dd>
                <dt className="text-[var(--color-text-secondary)]">Signal</dt>
                <dd className="text-right text-[var(--color-text-primary)]">live · 5s</dd>
              </dl>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(false);
                }}
                aria-label="Collapse metric details"
                className="mt-2 w-full rounded-md border border-[var(--glass-border)] py-1 font-mono text-[9px] tracking-micro uppercase text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              >
                Collapse
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
