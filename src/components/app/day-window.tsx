import { cx } from "@/components/ui/cx";

/**
 * Where a ferment sits against its typical window. Not a "ready" meter: the shaded band is
 * the template's typical range, the tick is today. Wording stays "Day 9 of a typical 7–14".
 */
export function DayWindow({
  day,
  range,
  stage,
  unit = "days",
  className,
}: {
  day: number;
  range: [number, number];
  stage: "f1" | "f2";
  unit?: "days" | "hours";
  className?: string;
}) {
  const max = Math.max(range[1] * 1.35, day + 1);
  const pct = (n: number) => `${Math.min(100, (n / max) * 100)}%`;
  const color = stage === "f1" ? "bg-tea" : "bg-action";
  const wash = stage === "f1" ? "bg-tea-wash" : "bg-bottle-wash";
  const unitLabel = unit === "hours" ? "h" : "";

  return (
    <div className={cx("flex items-center gap-3", className)}>
      <div
        role="img"
        aria-label={`${unit === "hours" ? `${day} hours` : `Day ${day}`}, typical ${range[0]} to ${range[1]} ${unit}`}
        className="relative h-1.5 w-full max-w-40 rounded-full bg-well"
      >
        <span className={cx("absolute inset-y-0 rounded-full", wash)} style={{ left: pct(range[0]), width: `calc(${pct(range[1])} - ${pct(range[0])})` }} />
        <span className={cx("absolute inset-y-0 left-0 rounded-full opacity-70", color)} style={{ width: pct(day) }} />
        <span className={cx("absolute -top-1 h-3.5 w-0.5 rounded-full", color)} style={{ left: pct(day) }} />
      </div>
      <span className="shrink-0 text-small text-ink-2">
        typical <span className="num">{range[0]}–{range[1]}</span>
        {unitLabel ? ` ${unitLabel}` : " days"}
      </span>
    </div>
  );
}
