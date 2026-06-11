import type { ProviderIntel } from "./data";

interface GlassGlobeProps {
  provider: ProviderIntel;
}

/** Radial frosted-glass sphere representing a cloud provider. */
export function GlassGlobe({ provider }: GlassGlobeProps) {
  return (
    <div
      data-globe={provider.key}
      aria-label={`${provider.name} cloud provider — $${(provider.monthlyCost / 1000).toFixed(1)}k/mo`}
      className="group relative h-[170px] w-[170px] rounded-full glass-panel"
      style={{
        background:
          "radial-gradient(circle at 30% 25%, color-mix(in oklab, var(--color-accent-primary) 22%, transparent), color-mix(in oklab, var(--card) 90%, transparent) 60%, color-mix(in oklab, var(--color-bg-deep) 90%, transparent))",
      }}
    >
      <div className="absolute inset-2 rounded-full border border-[var(--glass-border)]" />
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at 30% 20%, color-mix(in oklab, white 18%, transparent), transparent 45%)",
        }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
        <div className="font-mono text-[9px] tracking-micro uppercase text-[var(--color-text-secondary)]">
          {provider.region}
        </div>
        <div className="mt-1 font-display text-2xl font-medium text-[var(--color-text-primary)]">
          {provider.name}
        </div>
        <div className="mt-1 font-mono text-[11px] text-[var(--color-accent-primary)]">
          ${(provider.monthlyCost / 1000).toFixed(1)}k/mo
        </div>
        <div className="mt-2 flex items-center gap-2 text-[10px] text-[var(--color-text-secondary)]">
          <span>util {provider.utilization}%</span>
          <span className="h-0.5 w-0.5 rounded-full bg-[var(--color-text-secondary)]" />
          <span>{provider.instances} inst</span>
        </div>
      </div>
    </div>
  );
}
