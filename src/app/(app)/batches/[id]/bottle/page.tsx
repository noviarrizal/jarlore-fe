import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Page, PageHeader } from "@/components/app/page-header";
import { SkeletonRows } from "@/components/ui/states";
import { BottleForm, type BottleSource } from "@/features/batches/bottle-form";
import { api, isNotFound } from "@/lib/api";

export const metadata: Metadata = { title: "Bottle it" };

export default function BottlePage({ params }: PageProps<"/batches/[id]/bottle">) {
  return (
    <Page>
      <Suspense fallback={<SkeletonRows rows={5} />}>
        <Bottle params={params} />
      </Suspense>
    </Page>
  );
}

async function Bottle({ params }: { params: PageProps<"/batches/[id]/bottle">["params"] }) {
  const { id } = await params;
  const batch = await api.getBatch(id).catch((e) => {
    if (isNotFound(e)) notFound();
    throw e;
  });
  if (batch.status !== "active") redirect(`/batches/${id}`);

  const [recipes, recent] = await Promise.all([
    api.listRecipes("bottle"),
    api.listBatches({ type: batch.fermentationTypeId, limit: 12 }),
  ]);
  // Earlier bottles to repeat: the last few batches of this type that were bottled.
  const bottled = recent.data.filter((b) => b.id !== batch.id && b.bottleCount > 0).slice(0, 4);
  const earlier = (await Promise.all(bottled.map((b) => api.getBatch(b.id)))).flatMap((b) =>
    b.bottles.map(
      (bo): BottleSource => ({
        value: `bottle:${bo.id}`,
        label: `${b.code} ${bo.label}, ${bo.flavorName}${bo.rating ? ` (${bo.rating.overall}/5)` : ""}`,
        spec: { flavorName: bo.flavorName, volumeMl: bo.volumeMl, additions: bo.additions, primingSugarG: bo.primingSugarG, headspaceCm: bo.headspaceCm },
      }),
    ),
  );
  const recipeSources = recipes.data
    .filter((r) => r.fermentationTypeId === batch.fermentationTypeId && r.archivedAt === null && r.latestVersion.bottle)
    .map(
      (r): BottleSource => ({
        value: `recipe_version:${r.latestVersion.id}`,
        label: `${r.name} v${r.latestVersion.versionNo}`,
        spec: r.latestVersion.bottle!,
      }),
    );

  return (
    <>
      <PageHeader
        back={{ href: `/batches/${batch.id}`, label: `${batch.code} ${batch.name}` }}
        title={batch.bottles.length ? "Add bottles" : "Bottle it"}
        meta={
          batch.bottles.length
            ? `${batch.bottles.length} bottles already. New ones start their F2 today.`
            : "Split the F1 jar into F2 bottles. Give each one its own flavour, sugar or headspace."
        }
      />
      <BottleForm batch={{ id: batch.id, code: batch.code, bottleCount: batch.bottles.length }} sources={{ recipes: recipeSources, bottles: earlier }} />
    </>
  );
}
