"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { IconButton } from "./button";
import { cx } from "./cx";

/**
 * Bottom sheet on mobile, centred dialog from 768px.
 * Built on native <dialog>: focus trap, Esc to close and inert background come from the platform.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        // Click on the backdrop (the dialog element itself, outside the panel) closes.
        if (e.target === e.currentTarget) onClose();
      }}
      className={cx(
        "sheet m-0 mt-auto w-full max-w-none bg-transparent p-0 text-ink backdrop:bg-transparent",
        "md:m-auto md:w-[min(32rem,calc(100vw-4rem))]",
        className,
      )}
    >
      <div className="flex max-h-[88dvh] flex-col rounded-t-sheet bg-sheet shadow-float md:rounded-sheet">
        <div aria-hidden className="mx-auto mt-2 h-1 w-10 rounded-full bg-rule-strong md:hidden" />
        <header className="flex items-start gap-3 px-5 pt-3 pb-2 md:pt-5">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-section">
              {title}
            </h2>
            {description && <div className="mt-0.5 text-small text-ink-2">{description}</div>}
          </div>
          <IconButton label="Close" onClick={onClose} className="-mt-2 -mr-2">
            <X className="size-5" />
          </IconButton>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">{children}</div>
        {footer && (
          <footer className="border-t border-rule px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</footer>
        )}
      </div>
    </dialog>
  );
}
