import { RotateCcw } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Branch, Lineage } from "@/components/app/lineage";
import { Page, PageHeader, Section } from "@/components/app/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Changed } from "@/components/ui/changed";
import { Score } from "@/components/ui/rating";
import { StageTag } from "@/components/ui/stage-tag";
import { SkeletonRows } from "@/components/ui/states";
import { DiffTable } from "@/features/compare/diff-table";
import { api, isNotFound } from "@/lib/api";
import type { DiffRow } from "@/lib/api/types";
import { formatAmount, formatDate, formatDateYear, typeName } from "@/lib/format";

export const metadata: Metadata = { title: "Recipe" };

export default function RecipePage({ params }: PageProps<"/recipes/[id]">) {
  return (
    <Page width="list">
      <Suspense fallback={<SkeletonRows rows={5} />}>
        <RecipeDetail params={params} />
      </Suspense>
    </Page>
  );
}

async function RecipeDetail({ params }: { params: PageProps<"/recipes/[id]">["params"] }) {
  const { id } = await params;
  const recipe = await api.getRecipe(id).catch((e) => {
    if (isNotFound(e)) notFound();
    throw e;
  });
  const [versions, batches] = await Promise.all([api.listRecipeVersions(id), api.listRecipeBatches(id)]);
  const chronological = [...versions].sort((a, b) => a.versionNo - b.versionNo);
  // Each version's changes vs its parent come from the server diff.
  const steps = await Promise.all(
    chronological.map((v) => (v.versionNo > 1 ? api.diffRecipeVersions(id, v.versionNo - 1, v.versionNo) : Promise.resolve(null))),
  );
  const first = chronological[0];
  const latest = recipe.latestVersion;
  // Comparing non-neighbouring versions is a Pro feature; on the free plan the table is simply left out.
  const span = chronological.length > 2 ? await api.diffRecipeVersions(id, first.versionNo, latest.versionNo).catch(() => null) : null;
  const bottle = recipe.scope === "bottle" ? latest.bottle : null;
  const finishedFromLatest = batches.data.find((b) => b.recipeVersion?.versionId === latest.id && b.status === "finished");
  const brewHref = finishedFromLatest ? `/batches/${finishedFromLatest.id}/brew-again` : `/batches/new?recipeVersion=${latest.id}`;

  return (
    <>
      <PageHeader
        back={{ href: "/recipes", label: "Recipes" }}
        title={recipe.name}
        meta={`${typeName[recipe.fermentationTypeId]}, ${recipe.versionCount} ${recipe.versionCount === 1 ? "version" : "versions"} since ${formatDateYear(recipe.createdAt)}`}
        actions={
          recipe.scope === "batch" ? (
            <ButtonLink href={brewHref} variant="primary" icon={<RotateCcw className="size-4" aria-hidden />}>
              Brew v{latest.versionNo}
            </ButtonLink>
          ) : undefined
        }
      />
      {bottle && (
        <p className="max-w-prose text-body text-ink-2">
          A bottle recipe. When you bottle a batch, pick it under <span className="font-semibold text-ink">Start from</span> to fill a bottle with it.
        </p>
      )}

      <Section title={`Version ${latest.versionNo}, current`}>
        <dl className="divide-y divide-rule border-y border-rule">
          {bottle && (
            <>
              <div className="flex items-baseline justify-between gap-4 py-2">
                <dt className="text-ink-2">Flavour</dt>
                <dd className="text-right font-semibold">{bottle.flavorName}</dd>
              </div>
              {bottle.additions.map((a) => (
                <div key={a.name} className="flex items-baseline justify-between gap-4 py-2">
                  <dt className="min-w-0 break-words">
                    {a.name}, {a.form}
                  </dt>
                  <dd className="num shrink-0">{formatAmount(a.amount, a.unit)}</dd>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-4 py-2">
                <dt className="text-ink-2">Priming sugar</dt>
                <dd className="num">{formatAmount(bottle.primingSugarG, "g")}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-2">
                <dt className="text-ink-2">Bottle size</dt>
                <dd className="num">{formatAmount(bottle.volumeMl, "ml")}</dd>
              </div>
              {bottle.headspaceCm !== null && (
                <div className="flex items-baseline justify-between gap-4 py-2">
                  <dt className="text-ink-2">Headspace</dt>
                  <dd className="num">{formatAmount(bottle.headspaceCm, "cm")}</dd>
                </div>
              )}
            </>
          )}
          {latest.ingredients.map((i) => (
            <div key={i.id} className="flex items-baseline justify-between gap-4 py-2">
              <dt className="min-w-0 break-words">{i.name}</dt>
              <dd className="num shrink-0">{formatAmount(i.amount, i.unit)}</dd>
            </div>
          ))}
          {latest.params.targetF1Days !== undefined && (
            <div className="flex items-baseline justify-between gap-4 py-2">
              <dt className="text-ink-2">Target F1</dt>
              <dd className="num">{latest.params.targetF1Days} days</dd>
            </div>
          )}
          {latest.defaultBottles.length > 0 && (
            <div className="flex items-baseline justify-between gap-4 py-2">
              <dt className="text-ink-2">F2 bottles</dt>
              <dd className="text-right">
                {latest.defaultBottles.map((b) => `${b.flavorName}${b.primingSugarG ? `, ${b.primingSugarG} g sugar` : ""}`).join("; ")}
              </dd>
            </div>
          )}
        </dl>
      </Section>

      <Section title="How it got here">
        <Lineage
          tone="ink"
          root={
            <p className="text-small text-ink-2">
              {first.sourceBottleId ? "Saved from a bottle" : first.sourceBatchId ? "Saved from a batch" : "Written from scratch"}, {formatDate(first.createdAt)}
            </p>
          }
        >
          {chronological.map((v, i) => {
            const step = steps[i];
            return (
              <Branch
                key={v.id}
                highlight={v.id === latest.id}
                marker={<span className="code inline-flex h-7 min-w-9 items-center justify-center rounded-tag bg-well px-1.5 text-ink">v{v.versionNo}</span>}
                aside={
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-ink-2 sm:flex-col sm:items-end">
                    {v.avgOverall !== null ? <Score value={v.avgOverall} label="Average" /> : <span>Not rated</span>}
                    <span>
                      {v.batchCount} {v.batchCount === 1 ? "batch" : "batches"}
                    </span>
                  </div>
                }
              >
                <p className="text-small text-ink-2">{formatDate(v.createdAt)}</p>
                {v.changeNote && <p className="note text-body text-ink">{v.changeNote}</p>}
                {step && <ChangeList rows={step.rows} />}
              </Branch>
            );
          })}
        </Lineage>
      </Section>

      {span && (
        <Section title={`v${first.versionNo} compared with v${latest.versionNo}`}>
          <DiffTable
            caption={`${recipe.name}: version ${first.versionNo} against version ${latest.versionNo}`}
            onlyDifferences
            columns={[
              { key: "from", title: <span className="code">v{first.versionNo}</span>, isBaseline: true },
              { key: "to", title: <span className="code">v{latest.versionNo}</span> },
            ]}
            rows={span.rows}
          />
        </Section>
      )}

      <Section title={recipe.scope === "bottle" ? "Batches with a bottle from this recipe" : "Brewed from this recipe"}>
        {batches.data.length === 0 ? (
          <p className="text-body text-ink-2">No batches yet.</p>
        ) : (
          <ul className="divide-y divide-rule border-y border-rule">
            {batches.data.map((b) => (
              <li key={b.id} className="relative flex flex-wrap items-center gap-x-3 gap-y-1 py-3">
                <Link href={`/batches/${b.id}`} className="font-semibold after:absolute after:inset-0 after:content-[''] hover:underline">
                  <span className="code">{b.code}</span>
                </Link>
                {b.recipeVersion?.recipeId === recipe.id && <span className="code text-small text-ink-2">v{b.recipeVersion.versionNo}</span>}
                <StageTag stage={b.status === "active" ? b.stage : "done"} status={b.status} />
                <span className="text-small text-ink-2">{formatDate(b.startedAt)}</span>
                <span className="ml-auto">{b.rating ? <Score value={b.rating.overall} /> : null}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}

/** "Cane sugar 200 → 228 g" for each row that changed from the parent version. */
function ChangeList({ rows }: { rows: DiffRow[] }) {
  const changed = rows.filter((r) => r.differs);
  if (changed.length === 0) return <p className="mt-1 text-small text-ink-2">No recipe changes</p>;
  return (
    <ul className="mt-1.5 flex flex-col gap-0.5 text-small">
      {changed.map((r) => {
        const [from, to] = r.values;
        return (
          <li key={r.key} className="text-ink-2">
            {r.label}{" "}
            <span className="num text-ink">
              {from === null ? "added " : to === null ? "" : `${from} → `}
              {to === null ? <Changed>removed</Changed> : <Changed>{`${to}${r.unit ? ` ${r.unit}` : ""}`}</Changed>}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
