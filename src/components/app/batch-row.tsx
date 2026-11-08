import Link from "next/link";
import type { BatchSummary, Bottle, FermentationType } from "@/lib/api/types";
import { BottleGlyph } from "@/components/ui/glyphs";
import { cx } from "@/components/ui/cx";
import { Score } from "@/components/ui/rating";
import { StageTag } from "@/components/ui/stage-tag";
import { ageLabel, dayNumber, formatDate, hoursBetween, relativeDay, typeName } from "@/lib/format";
import { DayWindow } from "./day-window";
import { LogButton } from "./quick-log-sheet";

/**
 * One batch as a row on the page surface (not a card). Answers, in order:
 * what is it, what stage, the last thing you noticed, and what you can do next.
 */
export function BatchRow({
  batch,
  now,
  tz,
  types,
  bottles,
  showLog = true,
}: {
  batch: BatchSummary;
  now: string;
  tz: string;
  types: FermentationType[];
  bottles?: Bottle[];
  showLog?: boolean;
}) {
  const type = types.find((t) => t.id === batch.fermentationTypeId);
  const active = batch.status === "active";
  const stageInfo = type?.stages.find((s) => s.key === batch.stage) ?? type?.stages[0];
  const isKefirHours = batch.fermentationTypeId === "water_kefir" && batch.stage === "f1" && hoursBetween(batch.startedAt, now) < 48;
  const stageStart = batch.stage === "f2" && bottles?.[0] ? bottles[0].startedAt : batch.startedAt;

  return (
    <article className="relative flex gap-3 py-4">
      <div className="min-w-0 flex-1">
        <h3 className="flex flex-wrap items-baseline gap-x-2">
          <Link href={`/batches/${batch.id}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:shadow-none">
            <span className="code text-ink">{batch.code}</span>{" "}
            <span className="text-body font-semibold break-words">{batch.name}</span>
          </Link>
        </h3>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-small text-ink-2">
          {active ? (
            <StageTag
              stage={batch.stage}
              detail={batch.stage === "f2" ? ageLabel(stageStart, now, batch.fermentationTypeId).toLowerCase() : ageLabel(batch.startedAt, now, batch.fermentationTypeId).toLowerCase()}
            />
          ) : (
            <StageTag stage="done" status={batch.status} />
          )}
          <span>{typeName[batch.fermentationTypeId]}</span>
          {batch.recipeVersion && (
            <span>
              {batch.recipeVersion.recipeName === batch.name ? "Recipe" : batch.recipeVersion.recipeName} v{batch.recipeVersion.versionNo}
            </span>
          )}
          {!active && batch.finishedAt && <span>Finished {formatDate(batch.finishedAt, tz)}</span>}
          {batch.rating && <Score value={batch.rating.overall} />}
          {batch.isReference && <span className="font-semibold text-tea-ink">Reference batch</span>}
        </div>

        {active && stageInfo && batch.stage !== "done" && (
          <DayWindow
            className="mt-2.5"
            stage={batch.stage === "f2" ? "f2" : "f1"}
            day={isKefirHours ? hoursBetween(batch.startedAt, now) : dayNumber(stageStart, now)}
            range={isKefirHours ? [stageInfo.typicalDays[0] * 24, stageInfo.typicalDays[1] * 24] : stageInfo.typicalDays}
            unit={isKefirHours ? "hours" : "days"}
          />
        )}

        {bottles && bottles.length > 0 && <BottleStrip bottles={bottles} />}

        {active && (
          <p className="mt-2 text-small text-ink-2">
            {batch.lastLog ? (
              <>
                <span className="text-ink-3">{relativeDay(batch.lastLog.occurredAt, now, tz)}: </span>
                {batch.lastLog.note ? <span className="note text-ink">{batch.lastLog.note}</span> : <span>{batch.lastLog.kind === "burp" ? "Burped" : "Measured"}</span>}
              </>
            ) : (
              <span className="text-warning">Nothing logged yet</span>
            )}
          </p>
        )}
      </div>

      {active && showLog && (
        <div className="relative z-10 self-start">
          <LogButton
            compact
            target={{
              id: batch.id,
              code: batch.code,
              name: batch.name,
              bottles: bottles?.filter((b) => b.status === "conditioning" || b.status === "chilled").map(({ id, label, flavorName }) => ({ id, label, flavorName })),
            }}
          />
        </div>
      )}
    </article>
  );
}

/** Compact F2 summary: one glyph per bottle with its label; chilled bottles are shown cold. */
function BottleStrip({ bottles }: { bottles: Bottle[] }) {
  return (
    <ul aria-label="Bottles" className="mt-2.5 flex flex-wrap gap-1.5">
      {bottles.map((b) => (
        <li
          key={b.id}
          className={cx(
            "inline-flex h-7 items-center gap-1 rounded-tag border pr-2 pl-1 text-small",
            b.status === "chilled" ? "border-info/30 bg-info-wash text-info" : "border-rule bg-sheet text-ink",
          )}
        >
          <BottleGlyph className="size-4" />
          <span className="code">{b.label}</span>
          <span className="max-w-28 truncate text-ink-2">{b.flavorName}</span>
          {b.status === "chilled" && <span className="sr-only">(chilled)</span>}
        </li>
      ))}
    </ul>
  );
}
