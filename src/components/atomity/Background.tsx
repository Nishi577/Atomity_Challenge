import { motion, useReducedMotion } from "framer-motion";

export function Background() {
  const reduced = useReducedMotion();
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden grain">
      {/* radial grid */}
      <svg
        className="absolute left-1/2 top-1/2 h-[180vmin] w-[180vmin] -translate-x-1/2 -translate-y-1/2 opacity-[0.18]"
        viewBox="-500 -500 1000 1000"
      >
        <defs>
          <radialGradient id="fade" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.82 0.13 80)" stopOpacity="0.5" />
            <stop offset="60%" stopColor="oklch(0.82 0.13 80)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="oklch(0.82 0.13 80)" stopOpacity="0" />
          </radialGradient>
        </defs>
        {[60, 120, 180, 250, 330, 420].map((r) => (
          <circle key={r} cx="0" cy="0" r={r} fill="none" stroke="url(#fade)" strokeWidth="0.5" />
        ))}
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i * Math.PI * 2) / 24;
          const cos = parseFloat((Math.cos(a)).toFixed(4));
          const sin = parseFloat((Math.sin(a)).toFixed(4));
          return (
            <line
              key={i}
              x1={cos * 60}
              y1={sin * 60}
              x2={cos * 460}
              y2={sin * 460}
              stroke="url(#fade)"
              strokeWidth="0.3"
            />
          );
        })}
      </svg>

      {/* slow rotating concentric rings */}
      {!reduced &&
        [
          { size: 70, dur: 180, dir: 1 },
          { size: 95, dur: 240, dir: -1 },
          { size: 130, dur: 320, dir: 1 },
        ].map((r) => (
          <motion.div
            key={r.size}
            className="absolute left-1/2 top-1/2 rounded-full border border-[var(--glass-border)]"
            style={{
              width: `${r.size}vmin`,
              height: `${r.size}vmin`,
              marginLeft: `-${r.size / 2}vmin`,
              marginTop: `-${r.size / 2}vmin`,
            }}
            animate={{ rotate: 360 * r.dir }}
            transition={{ duration: r.dur, repeat: Infinity, ease: "linear" }}
          />
        ))}

      {/* scanning wave */}
      {!reduced && (
        <motion.div
          className="absolute inset-x-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, color-mix(in oklab, var(--primary) 60%, transparent), transparent)",
          }}
          animate={{ top: ["10%", "90%", "10%"] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* ambient center glow */}
      <div
        className="absolute left-1/2 top-1/2 h-[80vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--primary) 18%, transparent) 0%, transparent 60%)",
          filter: "blur(40px)",
        }}
      />
    </div>
  );
}