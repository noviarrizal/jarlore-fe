"use client";

import { Check } from "lucide-react";
import type { Bottle, Reminder } from "@/lib/api/types";
import { useQuickLog } from "@/components/app/quick-log-sheet";
import { formatTime, relativeDay } from "@/lib/format";

type BatchRef = { id: string; code: string; name: string; bottles: Bottle[] };

/**
 * Today's reminders as a short checklist. Tapping one opens the quick log already set to the
 * right kind (burp, taste) and the right bottle. Logging completes the reminder server-side.
 */
export function DueList({ reminders, batches, now }: { reminders: Reminder[]; batches: BatchRef[]; now: string }) {
  const openLog = useQuickLog();

  return (
    <ul className="divide-y divide-rule border-y border-rule">
      {reminders.map((r) => {
        const batch = batches.find((b) => b.id === r.batchId);
        if (!batch) return null;
        const bottles = batch.bottles.map(({ id, label, flavorName }) => ({ id, label, flavorName }));
        const overdue = r.dueAt < now;
        return (
          <li key={r.id}>
            <button
              type="button"
              onClick={() =>
                openLog(
                  { id: batch.id, code: batch.code, name: batch.name, bottles },
                  r.kind === "burp" ? "burp" : r.kind === "taste_check" ? "taste" : "note",
                )
              }
              className="flex min-h-14 w-full items-center gap-3 py-2 text-left"
            >
              <span aria-hidden className="flex size-6 shrink-0 items-center justify-center rounded-tag border-2 border-rule-strong text-transparent">
                <Check className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">
                  {r.label}
                </span>
                <span className="block truncate text-small text-ink-2">
                  <span className="code">{batch.code}</span> {batch.name}
                </span>
              </span>
              <span className={overdue ? "text-small font-semibold text-warning" : "text-small text-ink-2"}>
                {relativeDay(r.dueAt, now) === "Today" ? formatTime(r.dueAt) : relativeDay(r.dueAt, now)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
