import type { Metadata } from "next";
import { Suspense } from "react";
import { Page, PageHeader } from "@/components/app/page-header";
import { SkeletonRows } from "@/components/ui/states";
import { BatchesBrowser } from "@/features/batches/batches-browser";
import { api } from "@/lib/api";

export const metadata: Metadata = { title: "Batches" };

export default function BatchesPage() {
  return (
    <Page width="list">
      <PageHeader title="Batches" />
      <Suspense fallback={<SkeletonRows rows={6} />}>
        <Batches />
      </Suspense>
    </Page>
  );
}

async function Batches() {
  const [page, types, now, tz, entitlements] = await Promise.all([
    api.listBatches({ sort: "started_desc" }),
    api.listFermentationTypes(),
    api.now(),
    api.timezone(),
    api.getEntitlements(),
  ]);
  const f2 = await Promise.all(page.data.filter((b) => b.stage === "f2").map((b) => api.getBatch(b.id)));
  const bottles = Object.fromEntries(f2.map((b) => [b.id, b.bottles]));

  return (
    <BatchesBrowser
      batches={page.data}
      bottles={bottles}
      types={types}
      now={now}
      tz={tz}
      compareLimit={entitlements.limits.compareItems}
    />
  );
}
