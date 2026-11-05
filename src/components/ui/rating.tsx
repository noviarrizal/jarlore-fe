import { cx } from "./cx";

/**
 * Read-only 1–5 score as five short bars (like tally marks), not stars.
 * The number is always present for screen readers and for scanning.
 */
export function Score({ value, label = "Overall", className }: { value: number | null; label?: string; className?: string }) {
  if (value === null) return <span className={cx("text-small text-ink-3", className)}>Not rated</span>;
  return (
    <span className={cx("inline-flex items-center gap-1.5", className)}>
      <span aria-hidden className="flex items-end gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={cx("h-3 w-1 rounded-full", n <= value ? "bg-tea" : "bg-rule")} />
        ))}
      </span>
      <span className="num text-small text-ink">
        <span className="sr-only">{label} </span>
        {Number.isInteger(value) ? value : value.toFixed(1)}
        <span className="text-ink-3">/5</span>
      </span>
    </span>
  );
}
