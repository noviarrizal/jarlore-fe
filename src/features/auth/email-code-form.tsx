"use client";

import { useSearchParams } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { emailCodeSignIn, type EmailCodeState } from "./actions";

/** The browser's IANA time zone, filled in after hydration (the server can't know it). */
export function TimezoneInput() {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.value = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  }, []);
  return <input ref={ref} type="hidden" name="tz" defaultValue="" />;
}

/** Email sign-in: one email field, then a one-time code. No passwords. */
export function EmailCodeForm() {
  const params = useSearchParams();
  const [state, action, pending] = useActionState<EmailCodeState, FormData>(emailCodeSignIn, { step: "email" });
  const next = params.get("next") ?? "";
  const expired = params.get("expired") === "1";

  if (state.step === "code") {
    return (
      <form action={action} className="mt-3 flex flex-col gap-4" noValidate>
        <p className="max-w-prose text-body text-ink-2">
          {state.sent ? "We sent a sign-in code to " : "Enter the code we sent to "}
          <span className="font-semibold text-ink">{state.email}</span>. It works once and expires soon.
        </p>
        <input type="hidden" name="email" value={state.email} />
        <input type="hidden" name="next" value={next} />
        <TimezoneInput />
        <Field label="Code" error={state.message}>
          {(p) => (
            <Input
              {...p}
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={10}
              autoFocus
              required
              className="num tracking-widest"
            />
          )}
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" name="intent" value="verify" variant="primary" disabled={pending}>
            {pending ? "Checking…" : "Sign in"}
          </Button>
          <Button type="submit" name="intent" value="resend" disabled={pending}>
            Send a new code
          </Button>
          <Button type="submit" name="intent" value="change" variant="quiet" disabled={pending}>
            Use a different email
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form action={action} className="mt-3 flex flex-col gap-4" noValidate>
      <p className="max-w-prose text-body text-ink-2">
        {expired ? "Your session ended. Sign in again to carry on." : "We'll email you a one-time code. No password to remember."}
      </p>
      <input type="hidden" name="next" value={next} />
      <Field label="Email" error={state.message}>
        {(p) => <Input {...p} name="email" type="email" autoComplete="email" defaultValue={state.email} required autoFocus />}
      </Field>
      <div>
        <Button type="submit" name="intent" value="send" variant="primary" disabled={pending}>
          {pending ? "Sending…" : "Email me a code"}
        </Button>
      </div>
    </form>
  );
}
