import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BatchRow } from "@/components/app/batch-row";
import { Page, PageHeader, Section } from "@/components/app/page-header";
import { DueList } from "@/features/today/due-list";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, SkeletonRows } from "@/components/ui/states";
import { api } from "@/lib/api";
import { formatLongDay } from "@/lib/format";
import { RotateCcw } from "lucide-react";

export const metadata: Metadata = { title: "Today" };

export default function TodayPage() {
  return (
    <Page>
      <Suspense
        fallback={
          <>
            <PageHeader title="Today" />
            <SkeletonRows rows={4} />
          </>
        }
      >
        <Today />
      </Suspense>
    </Page>
  );
}

async function Today() {
  const [today, types, now] = await Promise.all([api.getToday(), api.listFermentationTypes(), api.now()]);
  // F2 rows show their bottles, so load full batches for those (the list projection has only a count).
  const f2 = await Promise.all(today.active.filter((b) => b.stage === "f2").map((b) => api.getBatch(b.id)));
  const bottlesOf = (id: string) => f2.find((b) => b.id === id)?.bottles;

  const jars = today.active.filter((b) => b.stage !== "f2");
  const bottled = today.active.filter((b) => b.stage === "f2");

  if (today.active.length === 0) {
    return (
      <>
        <PageHeader title="Today" meta={formatLongDay(now)} />
        <EmptyState
          title="Nothing brewing yet"
          body="Add what's on your counter right now. It takes about 20 seconds, and you can backdate the start."
          action={<ButtonLink href="/batches/new" variant="primary">Add a batch in progress</ButtonLink>}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Today" meta={formatLongDay(now)} />

      {today.due.length > 0 && (
        <Section title="Due today" aside={<span className="num text-small text-ink-2">{today.due.length}</span>}>
          <DueList
            reminders={today.due}
            batches={today.active.map((b) => ({ id: b.id, code: b.code, name: b.name, bottles: bottlesOf(b.id) ?? [] }))}
            now={now}
          />
        </Section>
      )}

      {jars.length > 0 && (
        <Section title="On the counter">
          <div className="divide-y divide-rule border-y border-rule">
            {jars.map((b) => (
              <BatchRow key={b.id} batch={b} now={now} types={types} />
            ))}
          </div>
        </Section>
      )}

      {bottled.length > 0 && (
        <Section title="In bottles">
          <div className="divide-y divide-rule border-y border-rule">
            {bottled.map((b) => (
              <BatchRow key={b.id} batch={b} now={now} types={types} bottles={bottlesOf(b.id)} />
            ))}
          </div>
        </Section>
      )}

      {today.recentlyFinished.length > 0 && (
        <Section title="Recently finished">
          <ul className="divide-y divide-rule border-y border-rule">
            {today.recentlyFinished.map((b) => (
              <li key={b.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <Link href={`/batches/${b.id}`} className="block truncate hover:underline">
                    <span className="code">{b.code}</span> <span className="font-semibold">{b.name}</span>
                  </Link>
                  <p className="mt-0.5 truncate text-small text-ink-2">
                    {b.rating?.overall ? `${b.rating.overall}/5` : "Not rated"}
                    {b.rating?.note && <span className="note text-ink">, “{b.rating.note}”</span>}
                  </p>
                </div>
                <ButtonLink href={`/batches/${b.id}/brew-again`} size="sm" icon={<RotateCcw className="size-4" aria-hidden />}>
                  Brew again
                </ButtonLink>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}
