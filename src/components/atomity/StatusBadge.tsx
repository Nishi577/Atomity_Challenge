import type { IntelCard } from "./data";

export function StatusBadge({ status }: { status: IntelCard["status"] }) {
  const colorVar =
    status === "Healthy"
      ? "var(--color-accent-success)"
      : status === "Recoverable"
        ? "var(--color-status-recoverable)"
        : status === "Saturated"
          ? "var(--color-accent-error)"
          : "var(--color-status-optimizing)";

  return (
    <span
      className="inline-block h-1.5 w-1.5 rounded-full"
      style={{ background: colorVar }}
      aria-label={status}
    />
  );
}
