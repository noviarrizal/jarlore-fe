import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "@/components/ui/cx";

/**
 * Page title block. Left-aligned, compact: titles orient, they don't decorate.
 * `back` renders a text link above the title on drill-in screens.
 */
export function PageHeader({
  title,
  meta,
  actions,
  back,
  className,
}: {
  title: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
  className?: string;
}) {
  return (
    <header className={cx("pt-4 pb-4 md:pt-8 md:pb-6", className)}>
      {back && (
        <Link
          href={back.href}
          className="-ml-1 mb-2 inline-flex h-9 items-center gap-1 rounded-control pr-2 text-small text-ink-2 hover:text-ink"
        >
          <ChevronLeft className="size-4" aria-hidden />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1 basis-64">
          <h1 className="text-title text-balance break-words md:text-title-lg">{title}</h1>
          {meta && <div className="mt-1 text-small text-ink-2">{meta}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}

/** Width containers. Use these instead of ad-hoc max-w values. */
export function Page({ width = "narrow", className, children }: { width?: "narrow" | "list" | "full"; className?: string; children: ReactNode }) {
  return (
    <main
      className={cx(
        "mx-auto w-full px-4 md:px-8",
        width === "narrow" && "max-w-content",
        width === "list" && "max-w-list",
        width === "full" && "max-w-page",
        className,
      )}
    >
      {children}
    </main>
  );
}

export function Section({
  title,
  aside,
  children,
  className,
  id,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  const headingId = id ?? `s-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <section aria-labelledby={headingId} className={cx("mt-6 md:mt-8", className)}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 id={headingId} className="text-section">
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}
