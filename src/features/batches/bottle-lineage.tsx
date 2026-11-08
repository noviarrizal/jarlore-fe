import type { ReactNode } from "react";
import type { Batch, Bottle, DiffRow, LogEntry } from "@/lib/api/types";
import { Branch, Lineage } from "@/components/app/lineage";
import { changedVsSiblings } from "@/features/compare/marking";
import { Changed } from "@/components/ui/changed";
import { BottleGlyph } from "@/components/ui/glyphs";
import { Score } from "@/components/ui/rating";
import { Tag } from "@/components/ui/stage-tag";
import { dayNumber, formatAmount, formatDate, formatVolume, relativeDay } from "@/lib/format";

/** jarlore-be keys addition rows by normalised name ("Ginger root" → "ginger_root"). */
const slug = (name: string) => name.trim().toLowerCase().split(/\s+/).join("_");

/**
 * F1 → F2 lineage for one batch. The diff rows come from POST /v1/compare (server-owned).
 * The marker lands on what makes each bottle different from its siblings (see changedVsSiblings).
 */
export function BottleLineage({
  batch,
  rows,
  logs,
  now,
  tz,
  actions,
}: {
  batch: Batch;
  rows: DiffRow[];
  logs: LogEntry[];
  now: string;
  tz: string;
  /** Per-bottle actions (rate, mark best, save as recipe), shown under each bottle. */
  actions?: (bottle: Bottle) => ReactNode;
}) {
  const odd = new Map(rows.map((r) => [r.key, changedVsSiblings(r)]));
  const isChanged = (key: string, i: number) => odd.get(key)?.has(i) ?? false;
  const bottledAt = batch.bottles[0]?.startedAt;
  const marked = batch.bottles.some((b) => b.isReference);
  const best = Math.max(...batch.bottles.map((b) => b.rating?.overall ?? 0));
  // The bottle you marked as best wins; otherwise the top score (4 or more).
  const isBest = (b: Bottle) => (marked ? b.isReference : best >= 4 && b.rating?.overall === best);

  return (
    <Lineage
      root={
        <div>
          <p className="font-semibold">
            <span className="code">{batch.code}</span> F1 jar
          </p>
          <p className="text-small text-ink-2">
            {formatVolume(batch.volumeMl)}
            {batch.vessel ? ` in a ${batch.vessel}` : ""}
            {bottledAt ? `, bottled ${formatDate(bottledAt, tz)} into ${batch.bottles.length}` : ""}
          </p>
        </div>
      }
    >
      {batch.bottles.map((b, i) => (
        <Branch
          key={b.id}
          highlight={isBest(b)}
          marker={
            <span className="flex h-10 w-8 flex-col items-center justify-center rounded-tag bg-bottle-wash text-action">
              <BottleGlyph className="size-4" />
              <span className="code text-small">{b.label}</span>
            </span>
          }
          aside={<BottleStatus bottle={b} logs={logs} now={now} tz={tz} />}
        >
          <p className="font-semibold break-words">
            <Changed when={isChanged("additions.flavorName", i)}>{b.flavorName}</Changed>
          </p>
          <ul className="mt-0.5 text-small text-ink-2">
            {b.additions.length === 0 && <li>No additions</li>}
            {b.additions.map((a) => (
              <li key={a.name}>
                {a.name},{" "}
                <Changed when={isChanged(`additions.${slug(a.name)}.form`, i)}>{a.form}</Changed>{" "}
                <span className="num text-ink">
                  <Changed when={isChanged(`additions.${slug(a.name)}.amount`, i)}>{formatAmount(a.amount, a.unit)}</Changed>
                </span>
              </li>
            ))}
            <li>
              Priming sugar{" "}
              <span className="num text-ink">
                <Changed when={isChanged("additions.primingSugarG", i)}>{formatAmount(b.primingSugarG, "g")}</Changed>
              </span>
              {b.headspaceCm !== null && (
                <>
                  , headspace{" "}
                  <span className="num text-ink">
                    <Changed when={isChanged("process.headspaceCm", i)}>{formatAmount(b.headspaceCm, "cm")}</Changed>
                  </span>
                </>
              )}
            </li>
          </ul>
          {b.hypothesis && <p className="note mt-1 text-body text-ink-2">{b.hypothesis}</p>}
          {b.rating?.note && <p className="note mt-1 text-body">{b.rating.note}</p>}
          {b.recipeVersion && (
            <p className="mt-1 text-small text-ink-2">
              From {b.recipeVersion.recipeName} v{b.recipeVersion.versionNo}
            </p>
          )}
          {actions?.(b)}
        </Branch>
      ))}
    </Lineage>
  );
}

function BottleStatus({ bottle, logs, now, tz }: { bottle: Bottle; logs: LogEntry[]; now: string; tz: string }) {
  if (bottle.rating) return <Score value={bottle.rating.overall} />;
  const lastBurp = logs.find((l) => l.bottleId === bottle.id && l.kind === "burp");
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 sm:flex-col sm:items-end">
      {bottle.status === "chilled" ? (
        <Tag className="bg-info-wash text-info">Chilled</Tag>
      ) : (
        <Tag className="bg-bottle-wash text-action">F2 day {dayNumber(bottle.startedAt, now)}</Tag>
      )}
      <span className="text-small text-ink-2">
        {lastBurp ? `Burped ${relativeDay(lastBurp.occurredAt, now, tz).toLowerCase()}` : "Not burped yet"}
      </span>
    </div>
  );
}
