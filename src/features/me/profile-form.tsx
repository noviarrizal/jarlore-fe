"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import type { Profile } from "@/lib/api/types";
import { updateProfile, type ProfileFormState } from "./actions";

/** Profile preferences. The time zone decides how every date and time reads. */
export function ProfileForm({ profile, zones }: { profile: Profile; zones: string[] }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(updateProfile, null);
  // Uncontrolled, so a choice made before hydration finishes is kept.
  const zoneRef = useRef<HTMLSelectElement>(null);
  // The device's zone exists only in the browser: null on the server, so hydration matches.
  const device = useSyncExternalStore(
    noSubscribe,
    () => Intl.DateTimeFormat().resolvedOptions().timeZone ?? null,
    () => null,
  );

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  const options = zones.includes(profile.timezone) ? zones : [profile.timezone, ...zones];
  const errorFor = (field: string) => (state && !state.ok && state.field === field ? state.message : undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Name" hint="Shown only to you." error={errorFor("displayName")}>
        {(p) => <Input {...p} name="displayName" defaultValue={profile.savedName ?? ""} maxLength={80} autoComplete="nickname" />}
      </Field>
      <Field
        label="Time zone"
        error={errorFor("timezone")}
        hint={
          device && device !== profile.timezone ? (
            <>
              This device is in {device}.{" "}
              <button type="button" className="font-semibold text-action underline underline-offset-2" onClick={() => {
                  if (zoneRef.current) zoneRef.current.value = device;
                }}>
                Use it
              </button>
            </>
          ) : (
            "Logs and reminders show in this zone. Changing it never changes when something happened."
          )
        }
      >
        {(p) => (
          <Select {...p} ref={zoneRef} name="timezone" defaultValue={profile.timezone}>
            {options.map((z) => (
              <option key={z} value={z}>
                {z.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Units" error={errorFor("unitSystem")}>
          {(p) => (
            <Select {...p} name="unitSystem" defaultValue={profile.unitSystem}>
              <option value="metric">Metric (g, ml, L)</option>
              <option value="us">US (oz, fl oz, gal)</option>
            </Select>
          )}
        </Field>
        <Field label="Temperature" error={errorFor("tempUnit")}>
          {(p) => (
            <Select {...p} name="tempUnit" defaultValue={profile.tempUnit}>
              <option value="C">Celsius</option>
              <option value="F">Fahrenheit</option>
            </Select>
          )}
        </Field>
      </div>
      {state && (state.ok || !state.field) && (
        <p role={state.ok ? "status" : "alert"} className={state.ok ? "text-small text-success" : "text-small text-danger"}>
          {state.message}
        </p>
      )}
      <div>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

const noSubscribe = () => () => {};
