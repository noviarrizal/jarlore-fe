import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Page, PageHeader } from "@/components/app/page-header";
import { Score } from "@/components/ui/rating";
import { EmptyState, SkeletonRows } from "@/components/ui/states";
import { api } from "@/lib/api";
import { formatDate, typeName } from "@/lib/format";

export const metadata: Metadata = { title: "Recipes" };

export default function RecipesPage() {
  return (
    <Page width="list">
      <PageHeader title="Recipes" meta="Every change to a recipe is saved as a new version. Old versions never change." />
      <Suspense fallback={<SkeletonRows rows={4} />}>
        <Recipes />
      </Suspense>
    </Page>
  );
}

async function Recipes() {
  const { data } = await api.listRecipes();

  if (data.length === 0) {
    return (
      <EmptyState
        title="Recipes appear when you save a batch you loved"
        body="Finish a batch, rate it, and choose “Save as recipe”. Next time, brew it again in two taps."
      />
    );
  }

  return (
    <ul className="divide-y divide-rule border-y border-rule">
      {data.map((r) => (
        <li key={r.id} className="relative py-4">
          <h2 className="text-body font-semibold break-words">
            <Link href={`/recipes/${r.id}`} className="after:absolute after:inset-0 after:content-[''] hover:underline">
              {r.name}
            </Link>
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-ink-2">
            <span>{typeName[r.fermentationTypeId]}</span>
            <span>
              <span className="code text-ink">v{r.latestVersion.versionNo}</span> since {formatDate(r.latestVersion.createdAt)}
            </span>
            <span>
              {r.batchCount} {r.batchCount === 1 ? "batch" : "batches"}
            </span>
            {r.avgOverall !== null && <Score value={r.avgOverall} label="Average" />}
          </div>
          {r.latestVersion.changeNote && <p className="note mt-1.5 text-body text-ink">{r.latestVersion.changeNote}</p>}
        </li>
      ))}
    </ul>
  );
}
