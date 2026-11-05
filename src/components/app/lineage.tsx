import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "@/components/ui/cx";

/**
 * Jarlore's signature: a parent drawn as a node with a trunk, children as branches.
 * Used for F1 jar → F2 bottles and for recipe v1 → v2 → v3.
 * The trunk colour is the parent's stage colour (tea for a jar). Never decorative elsewhere.
 */
export function Lineage({
  root,
  children,
  tone = "tea",
  className,
}: {
  root: ReactNode;
  children: ReactNode;
  tone?: "tea" | "ink";
  className?: string;
}) {
  return (
    <div className={cx("lineage", tone === "tea" ? "[--trunk:var(--tea)]" : "[--trunk:var(--rule-strong)]", className)}>
      <div className="relative flex gap-3">
        <div aria-hidden className="relative flex w-10 shrink-0 justify-center">
          <span className="mt-1 size-4 rounded-full border-2 border-[var(--trunk)] bg-sheet" />
          <span className="absolute top-5 bottom-0 w-0.5 bg-[var(--trunk)]" />
        </div>
        <div className="min-w-0 flex-1 pb-3">{root}</div>
      </div>
      <ol className="flex flex-col">{children}</ol>
    </div>
  );
}

export function Branch({
  marker,
  children,
  aside,
  href,
  highlight = false,
}: {
  marker: ReactNode;
  children: ReactNode;
  aside?: ReactNode;
  href?: string;
  highlight?: boolean;
}) {
  return (
    <li className="group/branch relative flex gap-3">
      {/* trunk segment: full height except on the last branch, which ends in a rounded elbow */}
      <span aria-hidden className="absolute top-0 left-5 h-full w-0.5 -translate-x-1/2 bg-[var(--trunk)] group-last/branch:hidden" />
      <span
        aria-hidden
        className="absolute top-0 left-5 h-7 w-4 -translate-x-px rounded-bl-[10px] border-b-2 border-l-2 border-[var(--trunk)]"
      />
      <div className="w-10 shrink-0" />
      <div
        className={cx(
          "relative mb-2 flex min-w-0 flex-1 flex-wrap items-start gap-x-3 gap-y-2 rounded-panel border px-3 py-3 sm:flex-nowrap",
          highlight ? "border-action bg-sheet" : "border-rule bg-sheet",
          href && "transition-colors hover:border-rule-strong",
        )}
      >
        <div className="shrink-0">{marker}</div>
        <div className="min-w-0 flex-1 basis-40">
          {href ? (
            <Link href={href} className="after:absolute after:inset-0 after:rounded-panel after:content-['']">
              {children}
            </Link>
          ) : (
            children
          )}
        </div>
        {/* Below 640px the aside drops under the content instead of squeezing it */}
        {aside && <div className="relative z-10 w-full pl-11 sm:w-auto sm:shrink-0 sm:pl-0 sm:text-right">{aside}</div>}
      </div>
    </li>
  );
}
