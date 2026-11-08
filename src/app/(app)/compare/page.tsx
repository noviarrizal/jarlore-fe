import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Page, PageHeader } from "@/components/app/page-header";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/states";
import { CompareView } from "@/features/compare/compare-view";
import { ApiError, api, onApiError } from "@/lib/api";
import type { CompareItemRef } from "@/lib/api/types";

export const metadata: Metadata = { title: "Compare" };

export default function ComparePage({ searchParams }: PageProps<"/compare">) {
  return (
    <Page width="full">
      <Suspense
        fallback={
          <>
            <PageHeader title="Compare" />
            <SkeletonRows rows={5} />
          </>
        }
      >
        <Compare searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

function parseItems(raw: string | string[] | undefined): CompareItemRef[] {
  const value = Array.isArray(raw) ? raw.join(",") : (raw ?? "");
  return value
    .split(",")
    .map((s) => s.trim().split(":"))
    .filter(([type, id]) => (type === "batch" || type === "bottle") && Boolean(id))
    .map(([type, id]) => ({ type: type as CompareItemRef["type"], id }));
}

async function Compare({ searchParams }: { searchParams: PageProps<"/compare">["searchParams"] }) {
  const requested = parseItems((await searchParams).items);
  const entitlements = await api.getEntitlements();
  const limit = entitlements.limits.compareItems;
  const items = requested.slice(0, limit);

  if (items.length < 2) {
    return (
      <>
        <PageHeader title="Compare" />
        <EmptyState
          title="Pick two batches or bottles to see what's different"
          body="Select them from your batches, or open a finished batch and choose “See what changed”."
          action={<ButtonLink href="/batches" variant="primary">Choose batches</ButtonLink>}
        />
      </>
    );
  }

  // Only the API's refusals are shown here; an expired session still redirects and
  // an unreachable API goes to the error boundary.
  const outcome = await api.compare(items).then(
    (data) => ({ ok: true as const, data }),
    (error: unknown) => onApiError({ ok: false as const, error })(error),
  );
  if (!outcome.ok) {
    const result = outcome.error;
    return (
      <>
        <PageHeader title="Compare" />
        <ErrorState
          title="Couldn't compare these"
          body={result instanceof ApiError && result.status === 404 ? "One of them was deleted or isn't yours. Pick again from Batches." : "Compare batches with batches, or bottles with bottles."}
          action={<Link href="/batches" className="font-semibold underline">Back to batches</Link>}
        />
      </>
    );
  }

  const result = outcome.data;
  const kind = items[0].type === "bottle" ? "bottles" : "batches";
  return (
    <>
      <PageHeader back={{ href: "/batches", label: "Batches" }} title={`Comparing ${result.items.length} ${kind}`} meta="The first column is the baseline. Marked values differ from it." />
      {requested.length > limit && (
        <p className="mb-4 rounded-panel bg-info-wash px-4 py-3 text-body text-ink">
          Showing the first {limit} of {requested.length}. Comparing up to 6 at once is part of Pro.
        </p>
      )}
      <CompareView result={result} />
    </>
  );
}
