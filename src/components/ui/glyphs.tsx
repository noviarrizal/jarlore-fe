import { cx } from "./cx";

/**
 * Jarlore's own two glyphs. Jar = F1 vessel, bottle = F2 experiment.
 * They are drawn, not taken from an icon set, because they are the product's vocabulary.
 * Decorative by default (aria-hidden); the surrounding text carries the meaning.
 */

export function JarGlyph({ className, filled = true }: { className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cx("shrink-0", className)} fill="none">
      <rect x="7" y="2.75" width="10" height="3" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6.5 7.5c-.9.6-1.5 1.6-1.5 2.8v8.2a2.75 2.75 0 0 0 2.75 2.75h8.5A2.75 2.75 0 0 0 19 18.5v-8.2c0-1.2-.6-2.2-1.5-2.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {filled && <path d="M6.5 12.5h11v6a1.5 1.5 0 0 1-1.5 1.5H8a1.5 1.5 0 0 1-1.5-1.5v-6Z" fill="currentColor" opacity=".28" />}
    </svg>
  );
}

export function BottleGlyph({ className, filled = true }: { className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cx("shrink-0", className)} fill="none">
      <path
        d="M10 2.75h4M10.5 2.75v4.1c0 .5-.2 1-.6 1.3-1.2 1-1.9 2.4-1.9 4V20a1.25 1.25 0 0 0 1.25 1.25h5.5A1.25 1.25 0 0 0 16 20v-7.85c0-1.6-.7-3-1.9-4a1.7 1.7 0 0 1-.6-1.3v-4.1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {filled && <path d="M9.25 13.5h5.5V19.5a.5.5 0 0 1-.5.5h-4.5a.5.5 0 0 1-.5-.5v-6Z" fill="currentColor" opacity=".28" />}
    </svg>
  );
}
