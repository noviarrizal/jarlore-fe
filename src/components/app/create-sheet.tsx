"use client";

import { ChevronRight, Plus, RotateCcw } from "lucide-react";
import Link from "next/link";
import type { BatchSummary } from "@/lib/api/types";
import { Sheet } from "@/components/ui/sheet";
import { StageTag } from "@/components/ui/stage-tag";
import { useQuickLog } from "./quick-log-sheet";

/**
 * The "+" button. Ordered by frequency: logging an active batch happens daily,
 * brewing again every week or two, starting from scratch rarely.
 */
export function CreateSheet({
  open,
  onClose,
  active,
  finished,
}: {
  open: boolean;
  onClose: () => void;
  active: BatchSummary[];
  finished: BatchSummary[];
}) {
  const openLog = useQuickLog();

  return (
    <Sheet open={open} onClose={onClose} title="New">
        <section aria-labelledby="create-log">
          <h3 id="create-log" className="text-label text-ink-2">
            Log on something brewing
          </h3>
          <ul className="mt-1 divide-y divide-rule">
            {active.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    openLog({ id: b.id, code: b.code, name: b.name });
                  }}
                  className="flex min-h-14 w-full items-center gap-3 py-2 text-left"
                >
                  <span className="code w-16 shrink-0 text-ink">{b.code}</span>
                  <span className="min-w-0 flex-1 truncate">{b.name}</span>
                  <StageTag stage={b.stage} />
                </button>
              </li>
            ))}
          </ul>
        </section>

        {finished.length > 0 && (
          <section aria-labelledby="create-again" className="mt-5">
            <h3 id="create-again" className="text-label text-ink-2">
              Brew again
            </h3>
            <ul className="mt-1 divide-y divide-rule">
              {finished.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/batches/${b.id}/brew-again`}
                    onClick={onClose}
                    className="flex min-h-14 items-center gap-3 py-2"
                  >
                    <RotateCcw className="size-4 shrink-0 text-ink-3" aria-hidden />
                    <span className="code w-14 shrink-0">{b.code}</span>
                    <span className="min-w-0 flex-1 truncate">{b.name}</span>
                    <ChevronRight className="size-4 text-ink-3" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <Link
          href="/batches/new"
          onClick={onClose}
          className="mt-5 flex min-h-14 items-center gap-3 rounded-control border border-dashed border-rule-strong px-3 text-body hover:border-action"
        >
          <Plus className="size-5 text-action" aria-hidden />
          <span className="flex-1">Start a new batch from scratch</span>
          <ChevronRight className="size-4 text-ink-3" aria-hidden />
        </Link>
    </Sheet>
  );
}
