import type { Metadata } from "next";
import { Suspense } from "react";
import { Page, PageHeader, Section } from "@/components/app/page-header";
import { SkeletonRows } from "@/components/ui/states";
import { api } from "@/lib/api";

export const metadata: Metadata = { title: "Me" };

/**
 * Settings overview. Read-only until jarlore-be exists: values come from GET /v1/me,
 * /v1/entitlements and /v1/measurement-definitions. Editing flows are the next task.
 */
export default function MePage() {
  return (
    <Page>
      <PageHeader title="Me" />
      <Suspense fallback={<SkeletonRows rows={6} />}>
        <Me />
      </Suspense>
    </Page>
  );
}

async function Me() {
  const [me, entitlements, defs] = await Promise.all([api.getMe(), api.getEntitlements(), api.listMeasurementDefinitions()]);
  const custom = defs.filter((d) => !d.isSystem);

  return (
    <>
      <Section title="Profile" className="mt-0 md:mt-0">
        <Rows
          rows={[
            ["Name", me.displayName],
            ["Units", me.unitSystem === "metric" ? "Metric (g, ml, L)" : "US (oz, fl oz, gal)"],
            ["Temperature", me.tempUnit === "C" ? "Celsius" : "Fahrenheit"],
            ["Time zone", me.timezone],
          ]}
        />
      </Section>

      <Section title="Measurements">
        <p className="mb-2 text-small text-ink-2">
          pH, temperature, Brix and gravity are built in. You have {custom.length} of {entitlements.limits.customMeasurements} custom measurements on the free plan.
        </p>
        <Rows rows={defs.map((d) => [d.label, `${d.unit}${d.isSystem ? "" : ", custom"}`])} />
      </Section>

      <Section title="Reminders and calendar">
        <Rows
          rows={[
            ["Email reminders", "On, sent at the time a check is due"],
            ["Calendar feed", "Subscribe from Apple, Google or Outlook calendar"],
          ]}
        />
      </Section>

      <Section title="Your data">
        <p className="max-w-prose text-body text-ink-2">
          Export everything as CSV and JSON at any time, on any plan. Deleting your account removes every batch, log and photo.
        </p>
      </Section>

      <Section title="Plan">
        <Rows
          rows={[
            ["Current plan", entitlements.plan === "free" ? "Free" : "Pro"],
            ["Compare", `Up to ${entitlements.limits.compareItems} at once`],
          ]}
        />
      </Section>

      <Section title="Food safety">
        <p className="max-w-prose text-body text-ink-2">
          Jarlore records what you did and what you measured. It never tells you a ferment is safe or ready. If you see fuzzy mould, smell
          something rotten, or are unsure, throw it out.
        </p>
      </Section>
    </>
  );
}

function Rows({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="divide-y divide-rule border-y border-rule">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-baseline justify-between gap-4 py-3">
          <dt className="text-ink-2">{k}</dt>
          <dd className="text-right">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
