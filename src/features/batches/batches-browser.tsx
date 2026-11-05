"use client";

import { GitCompareArrows, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { BatchSort, BatchSummary, Bottle, FermentationType, FermentationTypeId } from "@/lib/api/types";
import { BatchRow } from "@/components/app/batch-row";
import { Button } from "@/components/ui/button";
import { cx } from "@/components/ui/cx";
import { Input, Select } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { EmptyState } from "@/components/ui/states";

type View = "active" | "finished" | "archived" | "all";

const sorts: { value: BatchSort; label: string }[] = [
  { value: "started_desc", label: "Newest first" },
  { value: "started_asc", label: "Oldest first" },
  { value: "rating_desc", label: "Best rated" },
];

/**
 * Filtering the already-loaded first page is fine for a home brewer's volume (tens of batches).
 * When nextCursor starts appearing, move q/type/sort into GET /v1/batches query params.
 */
export function BatchesBrowser({
  batches,
  bottles,
  types,
  now,
  compareLimit,
}: {
  batches: BatchSummary[];
  bottles: Record<string, Bottle[]>;
  types: FermentationType[];
  now: string;
  compareLimit: number;
}) {
  const router = useRouter();
  const [view, setView] = useState<View>("active");
  const [q, setQ] = useState("");
  const [type, setType] = useState<FermentationTypeId | "">("");
  const [sort, setSort] = useState<BatchSort>("started_desc");
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const inView = (b: BatchSummary, v: View) =>
    v === "all" ||
    (v === "archived" ? Boolean(b.archivedAt) : !b.archivedAt && (v === "active" ? b.status === "active" : b.status !== "active"));

  const counts = useMemo(
    () => ({
      active: batches.filter((b) => inView(b, "active")).length,
      finished: batches.filter((b) => inView(b, "finished")).length,
      archived: batches.filter((b) => inView(b, "archived")).length,
      all: batches.length,
    }),
    [batches],
  );

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return batches
      .filter((b) => inView(b, view))
      .filter((b) => !type || b.fermentationTypeId === type)
      .filter((b) => !needle || `${b.code} ${b.name} ${b.recipeVersion?.recipeName ?? ""}`.toLowerCase().includes(needle))
      .sort((a, b) =>
        sort === "started_asc"
          ? a.startedAt.localeCompare(b.startedAt)
          : sort === "rating_desc"
            ? (b.rating?.overall ?? 0) - (a.rating?.overall ?? 0)
            : b.startedAt.localeCompare(a.startedAt),
      );
  }, [batches, view, type, q, sort]);

  const atLimit = selected.length >= compareLimit;

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= compareLimit ? s : [...s, id]));
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <Segmented
          label="Which batches"
          value={view}
          onChange={setView}
          className="w-full md:w-auto"
          options={[
            { value: "active", label: "Active", count: counts.active },
            { value: "finished", label: "Finished", count: counts.finished },
            { value: "archived", label: "Archived", count: counts.archived },
            { value: "all", label: "All", count: counts.all },
          ]}
        />
        <div className="grid grid-cols-2 gap-2 md:flex md:items-center">
          <div className="relative col-span-2 md:w-72">
            <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" />
            <Input
              type="search"
              aria-label="Search batches"
              placeholder="Search code, name or recipe"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select aria-label="Fermentation type" value={type} onChange={(e) => setType(e.target.value as FermentationTypeId | "")} className="md:w-44">
            <option value="">All types</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
          <Select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as BatchSort)} className="md:w-40">
            {sorts.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
          <Button
            variant={selecting ? "primary" : "secondary"}
            className="col-span-2 md:ml-auto"
            icon={<GitCompareArrows className="size-4" aria-hidden />}
            aria-pressed={selecting}
            onClick={() => {
              setSelecting((s) => !s);
              setSelected([]);
            }}
          >
            {selecting ? "Done selecting" : "Select to compare"}
          </Button>
        </div>
      </div>

      <div className="mt-4">
        {shown.length === 0 ? (
          <EmptyState
            title={q || type ? "No batches match" : view === "archived" ? "Nothing archived" : view === "finished" ? "No finished batches yet" : "Nothing brewing"}
            body={q || type ? "Try a shorter search or clear the type filter." : view === "finished" ? "Finished batches and their ratings collect here." : undefined}
            action={
              q || type ? (
                <Button
                  onClick={() => {
                    setQ("");
                    setType("");
                  }}
                >
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <ul className="divide-y divide-rule border-y border-rule">
            {shown.map((b) => {
              const isSelected = selected.includes(b.id);
              return (
                <li key={b.id} className={cx("relative", selecting && isSelected && "bg-bottle-wash/60")}>
                  <BatchRow batch={b} now={now} types={types} bottles={bottles[b.id]} showLog={!selecting} />
                  {selecting && (
                    <label className="absolute inset-0 z-20 flex cursor-pointer items-start justify-end p-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={!isSelected && atLimit}
                        onChange={() => toggle(b.id)}
                        className="size-6 accent-action"
                      />
                      <span className="sr-only">
                        Select {b.code} {b.name} to compare
                      </span>
                    </label>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {selecting && (
        <div className="fixed inset-x-0 bottom-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom))] z-40 border-t border-rule bg-sheet px-4 py-3 shadow-float md:bottom-0 md:left-sidebar">
          <div className="mx-auto flex max-w-list items-center gap-3">
            <p className="min-w-0 flex-1 text-small text-ink-2">
              {selected.length === 0
                ? "Pick two batches to see what changed."
                : atLimit && compareLimit === 2
                  ? "2 selected. Comparing 3 to 6 at once is part of Pro."
                  : `${selected.length} selected`}
            </p>
            <Button
              variant="primary"
              disabled={selected.length < 2}
              onClick={() => router.push(`/compare?items=${selected.map((id) => `batch:${id}`).join(",")}`)}
            >
              Compare {selected.length >= 2 ? selected.length : ""}
            </Button>
            <Button variant="quiet" aria-label="Cancel selecting" onClick={() => (setSelecting(false), setSelected([]))} className="px-2">
              <X className="size-5" aria-hidden />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
