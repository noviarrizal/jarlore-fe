import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Page, PageHeader } from "@/components/app/page-header";
import { SkeletonRows } from "@/components/ui/states";
import { BatchForm } from "@/features/batches/batch-form";
import { api, isNotFound } from "@/lib/api";

export const metadata: Metadata = { title: "Brew again" };

export default function BrewAgainPage({ params }: PageProps<"/batches/[id]/brew-again">) {
  return (
    <Page>
      <Suspense fallback={<SkeletonRows rows={5} />}>
        <BrewAgain params={params} />
      </Suspense>
    </Page>
  );
}

async function BrewAgain({ params }: { params: PageProps<"/batches/[id]/brew-again">["params"] }) {
  const { id } = await params;
  const draft = await api.getBrewAgainDraft(id).catch((e) => {
    if (isNotFound(e)) notFound();
    throw e;
  });
  const v = draft.recipeVersion;

  return (
    <>
      <PageHeader
        back={{ href: `/batches/${id}`, label: draft.base.title }}
        title="Brew again"
        meta={v ? `${v.recipeName} v${v.versionNo}, everything copied from ${draft.base.title}` : `Everything copied from ${draft.base.title}`}
      />
      <BatchForm
        initial={draft.draft}
        base={draft.base}
        versionNote={
          v
            ? `If you change ingredient amounts or the planned F1, this becomes ${v.recipeName} v${v.versionNo + 1}. Earlier versions stay exactly as they were.`
            : undefined
        }
      />
    </>
  );
}
