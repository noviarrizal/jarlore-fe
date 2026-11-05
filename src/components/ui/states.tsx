import type { ReactNode } from "react";
import { cx } from "./cx";

/** Empty state: an invitation to act, not an apology. Left-aligned inside lists, centred only full-page. */
export function EmptyState({
  title,
  body,
  action,
  className,
}: {
  title: string;
  body?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("rounded-panel border border-dashed border-rule-strong px-5 py-6", className)}>
      <p className="text-section text-ink">{title}</p>
      {body && <p className="mt-1 max-w-prose text-body text-ink-2">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Inline error with a concrete next step. */
export function ErrorState({ title, body, action }: { title: string; body: ReactNode; action?: ReactNode }) {
  return (
    <div role="alert" className="rounded-panel bg-danger-wash px-5 py-4 text-danger">
      <p className="text-section">{title}</p>
      <p className="mt-1 text-body text-ink">{body}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/** Skeleton row block. Used instead of full-screen spinners. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cx("animate-pulse rounded-control bg-well", className)} />;
}

export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading" className="divide-y divide-rule">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 py-4">
          <Skeleton className="size-10" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
