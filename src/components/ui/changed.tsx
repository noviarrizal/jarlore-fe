import type { ReactNode } from "react";

/**
 * The diff marker. Wraps a value that differs from what it is being compared against.
 * This is the ONLY use of the marker colour in the product.
 */
export function Changed({ when = true, children, label = "changed" }: { when?: boolean; children: ReactNode; label?: string }) {
  if (!when) return <>{children}</>;
  return (
    <mark className="mark-changed bg-transparent text-inherit">
      {children}
      <span className="sr-only"> ({label})</span>
    </mark>
  );
}
