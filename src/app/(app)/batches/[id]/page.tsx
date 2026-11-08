import { GitCompareArrows, RotateCcw, Split } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DayWindow } from "@/components/app/day-window";
import { Page, PageHeader, Section } from "@/components/app/page-header";
import { LogButton } from "@/components/app/quick-log-sheet";
import { Timeline } from "@/components/app/timeline";
import { ButtonLink } from "@/components/ui/button";
import { Score } from "@/components/ui/rating";
import { StageTag } from "@/components/ui/stage-tag";
import { Skeleton, SkeletonRows } from "@/components/ui/states";
import { BottleLineage } from "@/features/batches/bottle-lineage";
import { FinishButton } from "@/features/batches/finish-sheet";
import { SaveRecipeButton } from "@/features/batches/save-recipe-sheet";
import { RatingSummary } from "@/features/batches/rating-summary";
import { api, isNotFound } from "@/lib/api";
import type { Batch } from "@/lib/api/types";
import { ageLabel, dayNumber, formatAmount, formatDate, formatDateYear, formatTime, formatVolume, hoursBetween, relativeDay, typeName } from "@/lib/format";

export const metadata: Metadata = { title: "Batch" };

export default function BatchPage({ params }: PageProps<"/batches/[id]">) {
  return (
    <Page className="wide:max-w-wide">
      <Suspense fallback={<DetailSkeleton />}>
        <BatchDetail params={params} />
      </Suspense>
    </Page>
  );
}

async function BatchDetail({ params }: { params: PageProps<"/batches/[id]">["params"] }) {
  const { id } = await params;
  const batch = await api.getBatch(id).catch((e) => {
    if (isNotFound(e)) notFound();
    throw e;
  });
  const [logs, types, now, reference, parent, recipes] = await Promise.all([
    api.listBatchLogs(id),
    api.listFermentationTypes(),
    api.now(),
    api.getBatchReference(id),
    batch.parentBatchId ? api.getBatch(batch.parentBatchId).catch(() => null) : Promise.resolve(null),
    batch.status === "finished" ? api.listRecipes("batch") : Promise.resolve(null),
  ]);
  const bottleDiff =
    batch.bottles.length > 1 ? await api.compare(batch.bottles.map((b) => ({ type: "bottle" as const, id: b.id }))) : null;

  const type = types.find((t) => t.id === batch.fermentationTypeId);
  const active = batch.status === "active";
  const canBottle = active && type?.stages.some((s) => s.key === "f2") && (batch.stage === "f1" || batch.stage === "f2");
  const sameTypeRecipes = (recipes?.data ?? [])
    .filter((r) => r.fermentationTypeId === batch.fermentationTypeId && r.archivedAt === null)
    .map((r) => ({ id: r.id, name: r.name, versionCount: r.versionCount }));
  const compareWith = parent ?? reference;
  const logTarget = {
    id: batch.id,
    code: batch.code,
    name: batch.name,
    bottles: batch.bottles.filter((b) => b.status === "conditioning" || b.status === "chilled").map(({ id, label, flavorName }) => ({ id, label, flavorName })),
  };

  return (
    <>
      <PageHeader
        back={{ href: "/batches", label: "Batches" }}
        title={
          <>
            <span className="code mr-2 text-ink-2">{batch.code}</span>
            {batch.name}
          </>
        }
        meta={
          <>
            {typeName[batch.fermentationTypeId]}, started {formatDateYear(batch.startedAt)}
            {batch.recipeVersion && (
              <>
                {" "}from{" "}
                <Link href={`/recipes/${batch.recipeVersion.recipeId}`} className="font-semibold text-ink underline decoration-rule-strong underline-offset-2 hover:decoration-ink">
                  {batch.recipeVersion.recipeName} v{batch.recipeVersion.versionNo}
                </Link>
              </>
            )}
          </>
        }
        actions={
          active ? (
            <>
              <LogButton target={logTarget} variant="primary" />
              {canBottle && (
                <ButtonLink href={`/batches/${batch.id}/bottle`} icon={<Split className="size-4" aria-hidden />}>
                  {batch.bottles.length ? "Add bottles" : "Bottle it"}
                </ButtonLink>
              )}
              <FinishButton target={{ type: "batch", id: batch.id, title: batch.code }} />
            </>
          ) : (
            <>
              <ButtonLink href={`/batches/${batch.id}/brew-again`} variant="primary" icon={<RotateCcw className="size-4" aria-hidden />}>
                Brew again
              </ButtonLink>
              {batch.status === "finished" && (
                <SaveRecipeButton target={{ type: "batch", id: batch.id, title: batch.code }} defaultName={batch.name} recipes={sameTypeRecipes} />
              )}
            </>
          )
        }
      />

      <div className="wide:grid wide:grid-cols-[minmax(0,1fr)_20rem] wide:gap-10">
        <div className="min-w-0">
          {/* Now: stage, window, last observation, next reminder */}
          <section aria-label="Current state" className="flex flex-col gap-3 border-y border-rule py-4">
            <div className="flex flex-wrap items-center gap-3">
              {active ? (
                <StageTag stage={batch.stage} detail={ageLabel(batch.bottles[0]?.startedAt ?? batch.startedAt, now, batch.fermentationTypeId).toLowerCase()} />
              ) : (
                <StageTag stage="done" status={batch.status} detail={batch.finishedAt ? formatDate(batch.finishedAt) : undefined} />
              )}
              {batch.isReference && <span className="text-small font-semibold text-tea-ink">Your reference batch</span>}
              {batch.rating && <Score value={batch.rating.overall} />}
            </div>
            {active && type && batch.stage === "f1" && (
              <DayWindow
                stage="f1"
                day={batch.fermentationTypeId === "water_kefir" ? hoursBetween(batch.startedAt, now) : dayNumber(batch.startedAt, now)}
                range={
                  batch.fermentationTypeId === "water_kefir"
                    ? [type.stages[0].typicalDays[0] * 24, type.stages[0].typicalDays[1] * 24]
                    : type.stages[0].typicalDays
                }
                unit={batch.fermentationTypeId === "water_kefir" ? "hours" : "days"}
              />
            )}
            {active && (
              <dl className="grid gap-x-6 gap-y-2 text-small sm:grid-cols-2">
                <div>
                  <dt className="text-ink-2">Last logged</dt>
                  <dd className="mt-0.5 text-body">
                    {batch.lastLog ? (
                      <>
                        {relativeDay(batch.lastLog.occurredAt, now)}, {formatTime(batch.lastLog.occurredAt)}
                        {batch.lastLog.note && <span className="note block text-ink">{batch.lastLog.note}</span>}
                      </>
                    ) : (
                      <span className="text-warning">Nothing yet</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-2">Next</dt>
                  <dd className="mt-0.5 text-body">
                    {batch.nextReminder
                      ? `${batch.nextReminder.label}, ${relativeDay(batch.nextReminder.dueAt, now).toLowerCase()}`
                      : "No reminder set"}
                  </dd>
                </div>
              </dl>
            )}
          </section>

          {/* The experiment: why this batch exists and what to hold it against */}
          {(batch.hypothesis || compareWith) && (
            <Section title="What you're testing">
              {batch.hypothesis ? (
                <p className="note max-w-prose text-body-lg">{batch.hypothesis}</p>
              ) : (
                <p className="text-body text-ink-2">No hypothesis written for this batch.</p>
              )}
              {compareWith && (
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <p className="text-small text-ink-2">
                    {parent ? "Brewed again from" : "Your last good batch is"}{" "}
                    <Link href={`/batches/${compareWith.id}`} className="font-semibold text-ink hover:underline">
                      <span className="code">{compareWith.code}</span> {compareWith.name}
                    </Link>
                    {compareWith.rating && `, rated ${compareWith.rating.overall}/5`}
                  </p>
                  <ButtonLink
                    href={`/compare?items=batch:${compareWith.id},batch:${batch.id}`}
                    size="sm"
                    icon={<GitCompareArrows className="size-4" aria-hidden />}
                  >
                    See what changed
                  </ButtonLink>
                </div>
              )}
            </Section>
          )}

          {batch.rating && (
            <Section title="How it turned out">
              <RatingSummary rating={batch.rating} />
            </Section>
          )}

          {batch.bottles.length > 0 && (
            <Section
              title={`F2 bottles (${batch.bottles.length})`}
              aside={
                <Link href={`/batches/${batch.id}/bottles`} className="text-small font-semibold text-action hover:underline">
                  Open F2 experiments
                </Link>
              }
            >
              <BottleLineage batch={batch} rows={bottleDiff?.rows ?? []} logs={logs.data} now={now} />
            </Section>
          )}

          <Section title="Timeline">
            <Timeline logs={logs.data} bottles={batch.bottles} now={now} />
          </Section>
        </div>

        <aside className="min-w-0">
          <Ingredients batch={batch} />
        </aside>
      </div>
    </>
  );
}

function Ingredients({ batch }: { batch: Batch }) {
  return (
    <Section title="Ingredients" className="wide:mt-0">
      <p className="mb-3 text-small text-ink-2">
        {batch.recipeVersion
          ? `Frozen from ${batch.recipeVersion.recipeName} v${batch.recipeVersion.versionNo} when this batch started. Editing the recipe won't change it.`
          : "Recorded when this batch started."}
      </p>
      <dl className="divide-y divide-rule border-y border-rule">
        {batch.ingredients.map((i) => (
          <div key={i.id} className="flex items-baseline justify-between gap-4 py-2">
            <dt className="min-w-0 break-words">{i.name}</dt>
            <dd className="num shrink-0">{formatAmount(i.amount, i.unit)}</dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-4 py-2">
          <dt className="text-ink-2">Batch size</dt>
          <dd className="num">{formatVolume(batch.volumeMl)}</dd>
        </div>
        {batch.params.roomTempC !== undefined && (
          <div className="flex items-baseline justify-between gap-4 py-2">
            <dt className="text-ink-2">Room temperature</dt>
            <dd className="num">{batch.params.roomTempC} °C</dd>
          </div>
        )}
        {batch.params.targetF1Days !== undefined && (
          <div className="flex items-baseline justify-between gap-4 py-2">
            <dt className="text-ink-2">Planned F1</dt>
            <dd className="num">{batch.params.targetF1Days} days</dd>
          </div>
        )}
        {batch.vessel && (
          <div className="flex items-baseline justify-between gap-4 py-2">
            <dt className="text-ink-2">Vessel</dt>
            <dd className="text-right">{batch.vessel}</dd>
          </div>
        )}
      </dl>
    </Section>
  );
}

function DetailSkeleton() {
  return (
    <div className="pt-8">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="mt-4 h-8 w-3/5" />
      <Skeleton className="mt-2 h-4 w-2/5" />
      <div className="mt-8">
        <SkeletonRows rows={3} />
      </div>
    </div>
  );
}
