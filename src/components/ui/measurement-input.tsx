"use client";

import { useId } from "react";
import type { MeasurementDefinition } from "@/lib/api/types";
import { cx } from "./cx";

/**
 * Numeric measurement with its unit inside the field.
 * Opens the decimal keypad on phones. Range is a hint, not a block:
 * brewers sometimes measure odd things, and the server is the validator.
 */
export function MeasurementInput({
  definition,
  value,
  onChange,
  className,
}: {
  definition: Pick<MeasurementDefinition, "key" | "label" | "unit" | "min" | "max" | "decimals">;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const id = useId();
  const n = value === "" ? null : Number(value.replace(",", "."));
  const outOfRange =
    n !== null && (Number.isNaN(n) || (definition.min !== null && n < definition.min) || (definition.max !== null && n > definition.max));
  const unit = definition.key === "ph" ? null : definition.unit;

  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-label text-ink">
        {definition.label}
      </label>
      <div
        className={cx(
          "flex h-11 items-center rounded-control border bg-sheet transition-colors focus-within:border-action",
          outOfRange ? "border-warning" : "border-rule hover:border-rule-strong",
        )}
      >
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="done"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={definition.min !== null && definition.max !== null ? `${definition.min}–${definition.max}` : undefined}
          aria-describedby={outOfRange ? `${id}-range` : undefined}
          className="num h-full w-full min-w-0 rounded-control bg-transparent px-3 text-body-lg outline-none placeholder:text-ink-3 focus-visible:shadow-none"
        />
        {unit && <span className="pr-3 text-small text-ink-3">{unit}</span>}
      </div>
      {outOfRange && (
        <p id={`${id}-range`} className="text-small text-warning">
          Outside the usual {definition.min}–{definition.max}. Saved as entered.
        </p>
      )}
    </div>
  );
}
