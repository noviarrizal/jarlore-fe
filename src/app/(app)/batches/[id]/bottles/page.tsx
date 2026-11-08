import { GitCompareArrows, Plus, Wind } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Page, PageHeader, Section } from "@/components/app/page-header";
import { LogButton } from "@/components/app/quick-log-sheet";
import { Timeline } from "@/components/app/timeline";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, SkeletonRows } from "@/components/ui/states";
import { BottleActions } from "@/features/batches/bottle-actions";
import { BottleLineage } from "@/features/batches/bottle-lineage";
import { DiffTable } from "@/features/compare/diff-table";
import { api, isNotFound } from "@/lib/api";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "F2 experiments" };

export default function BottlesPage({ params }: PageProps<"/batches/[id]/bottles">) {
  return (
    <Page width="list">
      <Suspense fallback={<SkeletonRows rows={4} />}>
        <Bottles params={params} />
      </Suspense>
    </Page>
  );
}

async function Bottles({ params }: { params: PageProps<"/batches/[id]/bottles">["params"] }) {
  const { id } = await params;
  const batch = await api.getBatch(id).catch((e) => {
    if (isNotFound(e)) notFound();
    throw e;
  });
  const [logs, now, tz, recipes] = await Promise.all([api.listBatchLogs(id), api.now(), api.timezone(), api.listRecipes("bottle")]);
  const bottleRecipes = recipes.data
    .filter((r) => r.fermentationTypeId === batch.fermentationTypeId && r.archivedAt === null)
    .map((r) => ({ id: r.id, name: r.name, versionCount: r.versionCount }));
  const canAdd = batch.status === "active" && (batch.stage === "f1" || batch.stage === "f2");
  const back = { href: `/batches/${batch.id}`, label: `${batch.code} ${batch.name}` };

  if (batch.bottles.length === 0) {
    return (
      <>
        <PageHeader back={back} title="F2 experiments" />
        <EmptyState
          title="Not bottled yet"
          body="When F1 tastes right, split it into bottles. Give each one a different flavour, sugar or headspace, and Jarlore keeps track of which was which."
          action={
            canAdd ? (
              <ButtonLink href={`/batches/${batch.id}/bottle`} variant="primary">
                Bottle it
              </ButtonLink>
            ) : undefined
          }
        />
      </>
    );
  }

  const diff = batch.bottles.length > 1 ? await api.compare(batch.bottles.map((b) => ({ type: "bottle" as const, id: b.id }))) : null;
  const open = batch.bottles.filter((b) => b.status === "conditioning" || b.status === "chilled");
  const target = { id: batch.id, code: batch.code, name: batch.name, bottles: open.map(({ id, label, flavorName }) => ({ id, label, flavorName })) };
  const bottleLogs = logs.data.filter((l) => l.bottleId !== null);

  return (
    <>
      <PageHeader
        back={back}
        title="F2 experiments"
        meta={`${batch.bottles.length} bottles from ${batch.code}, bottled ${formatDate(batch.bottles[0].startedAt, tz)}`}
        actions={
          open.length > 0 || canAdd ? (
            <>
              {open.length > 0 && <LogButton target={target} kind="burp" label="Burp" icon={<Wind className="size-4.5" aria-hidden />} />}
              {canAdd && (
                <ButtonLink href={`/batches/${batch.id}/bottle`} icon={<Plus className="size-4" aria-hidden />}>
                  Add bottles
                </ButtonLink>
              )}
              {open.length > 0 && <LogButton target={target} variant="primary" />}
            </>
          ) : undefined
        }
      />

      {batch.hypothesis && (
        <p className="note max-w-prose border-l-2 border-tea pl-3 text-body-lg">{batch.hypothesis}</p>
      )}

      <Section title="From jar to bottles">
        <BottleLineage
          batch={batch}
          rows={diff?.rows ?? []}
          logs={logs.data}
          now={now}
          tz={tz}
          actions={(b) => <BottleActions bottle={b} batchCode={batch.code} bottleRecipes={bottleRecipes} />}
        />
      </Section>

      {diff && (
        <Section
          title="What differs between bottles"
          aside={
            <ButtonLink
              href={`/compare?items=${batch.bottles.map((b) => `bottle:${b.id}`).join(",")}`}
              size="sm"
              icon={<GitCompareArrows className="size-4" aria-hidden />}
            >
              Compare with results
            </ButtonLink>
          }
        >
          {batch.bottles.length > 2 && (
            <p className="mb-2 text-small text-ink-2 md:hidden">Swipe the table sideways to see all {batch.bottles.length} bottles.</p>
          )}
          <DiffTable
            caption={`Differences between the bottles of ${batch.code}`}
            baseline="siblings"
            onlyDifferences
            columns={diff.items.map((it, i) => ({ key: it.ref.id, title: <span className="code">{batch.bottles[i].label}</span>, subtitle: it.subtitle }))}
            rows={diff.rows.filter((r) => r.group !== "result")}
          />
        </Section>
      )}

      <Section title="Bottle log">
        <Timeline logs={bottleLogs} bottles={batch.bottles} now={now} tz={tz} />
      </Section>
    </>
  );
}
