import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Page, PageHeader } from "@/components/app/page-header";
import { SkeletonRows } from "@/components/ui/states";
import { BatchForm } from "@/features/batches/batch-form";
import { api } from "@/lib/api";
import type { FermentationTypeId } from "@/lib/api/types";

export const metadata: Metadata = { title: "New batch" };

export default function NewBatchPage({ searchParams }: PageProps<"/batches/new">) {
  return (
    <Page>
      <Suspense fallback={<SkeletonRows rows={5} />}>
        <NewBatch searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

const isType = (t: unknown): t is FermentationTypeId => t === "kombucha" || t === "water_kefir" || t === "custom";

async function NewBatch({ searchParams }: { searchParams: PageProps<"/batches/new">["searchParams"] }) {
  const sp = await searchParams;
  const versionId = typeof sp.recipeVersion === "string" ? sp.recipeVersion : null;

  if (versionId) {
    const v = await api.getRecipeVersion(versionId);
    return (
      <>
        <PageHeader back={{ href: `/recipes/${v.recipeId}`, label: v.recipeName }} title={`Brew ${v.recipeName} v${v.versionNo}`} />
        <BatchForm
          base={null}
          initial={{
            fermentationTypeId: v.fermentationTypeId,
            name: v.recipeName,
            volumeMl: 4200,
            ingredients: v.ingredients,
            params: v.params,
            source: { type: "recipe_version", id: v.id },
            hypothesis: null,
          }}
        />
      </>
    );
  }

  const type = isType(sp.type) ? sp.type : null;
  if (!type) {
    const types = await api.listFermentationTypes();
    return (
      <>
        <PageHeader back={{ href: "/today", label: "Today" }} title="What are you brewing?" />
        <ul className="divide-y divide-rule border-y border-rule">
          {types.map((t) => (
            <li key={t.id}>
              <Link href={`/batches/new?type=${t.id}`} className="flex min-h-14 flex-col justify-center py-3 hover:bg-well">
                <span className="font-semibold">{t.name}</span>
                <span className="text-small text-ink-2">{t.stages.map((s) => `${s.label}, typically ${s.typicalDays[0]}–${s.typicalDays[1]} days`).join("; then ")}</span>
              </Link>
            </li>
          ))}
        </ul>
      </>
    );
  }

  const template = await api.getBatchTemplate(type);
  return (
    <>
      <PageHeader back={{ href: "/batches/new", label: "Change type" }} title="New batch" />
      <BatchForm base={null} initial={{ fermentationTypeId: type, ...template, hypothesis: null }} />
    </>
  );
}
