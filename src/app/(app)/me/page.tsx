import type { Metadata } from "next";
import { Suspense } from "react";
import { Page, PageHeader, Section } from "@/components/app/page-header";
import { SkeletonRows } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { signOut } from "@/features/auth/actions";
import { ProfileForm } from "@/features/me/profile-form";
import { api } from "@/lib/api";

export const metadata: Metadata = { title: "Me" };

/**
 * Settings. Profile preferences are edited here (PATCH /v1/me); the rest is read
 * from GET /v1/entitlements and /v1/measurement-definitions.
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
        <Rows rows={[["Email", me.email ?? "—"]]} />
        <div className="mt-4">
          <ProfileForm profile={me} zones={timeZones()} />
        </div>
      </Section>

      <Section title="Measurements">
        <p className="mb-2 text-small text-ink-2">
          pH, temperature, Brix and gravity are built in.{" "}
          {entitlements.limits.customMeasurements === null
            ? `You have ${custom.length} custom measurements.`
            : `You have ${custom.length} of ${entitlements.limits.customMeasurements} custom measurements on the free plan.`}
        </p>
        <Rows rows={defs.map((d) => [d.label, `${d.unit}${d.isSystem ? "" : ", custom"}`])} />
      </Section>

      <Section title="Reminders">
        <p className="max-w-prose text-body text-ink-2">
          Taste checks, burps and fridge reminders appear on Today when they&apos;re due. Email reminders and a calendar feed aren&apos;t
          available yet.
        </p>
      </Section>

      <Section title="Your data">
        <p className="max-w-prose text-body text-ink-2">
          Your batches, bottles, logs and recipes are kept for you alone. Export and account deletion aren&apos;t available yet; they will
          be free on every plan.
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

      <Section title="Session">
        <form action={signOut}>
          <Button type="submit">Sign out</Button>
        </form>
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

/** Every IANA zone the runtime knows, plus UTC. */
function timeZones(): string[] {
  const zones = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
  return zones.includes("UTC") ? zones : ["UTC", ...zones];
}
