"use client";

import { useRef, type KeyboardEvent } from "react";
import { cx } from "./cx";

/**
 * Segmented control for switching a view's filter (Active / Finished / Archived).
 * Implements the ARIA radiogroup pattern: arrow keys move the selection.
 */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; count?: number }[];
  onChange: (value: T) => void;
  className?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: KeyboardEvent, index: number) {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (index + delta + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  }

  return (
    <div role="radiogroup" aria-label={label} className={cx("inline-flex rounded-control bg-well p-1", className)}>
      {options.map((o, i) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cx(
              "flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-tag px-3 text-label transition-colors",
              selected ? "bg-sheet text-ink ring-1 ring-rule" : "text-ink-2 hover:text-ink",
            )}
          >
            {o.label}
            {o.count !== undefined && <span className="num text-small text-ink-3">{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
