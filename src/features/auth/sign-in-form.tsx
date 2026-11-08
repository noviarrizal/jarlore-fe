"use client";

import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { signInDev, type SignInState } from "./actions";
import { TimezoneInput } from "./email-code-form";

const accounts = [
  { value: "demo", label: "Demo brewer", hint: "demo@jarlore.local" },
  { value: "other", label: "Second brewer", hint: "other@jarlore.local, to check that accounts can't see each other" },
];

export function SignInForm() {
  const [state, action, pending] = useActionState<SignInState, FormData>(signInDev, null);
  const params = useSearchParams();
  const expired = params.get("expired") === "1";
  return (
    <form action={action} className="mt-3 flex flex-col gap-4">
      <p className="max-w-prose text-body text-ink-2">
        {expired ? "Your session ended. Sign in again to carry on." : "Development sign-in. Pick an account; each one keeps its own batches."}
      </p>
      <input type="hidden" name="next" value={params.get("next") ?? ""} />
      <TimezoneInput />
      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">Account</legend>
        {accounts.map((a, i) => (
          <label
            key={a.value}
            className="flex min-h-14 cursor-pointer items-start gap-3 rounded-control border border-rule bg-sheet px-3 py-3 has-checked:border-action has-checked:bg-bottle-wash"
          >
            <input type="radio" name="user" value={a.value} defaultChecked={i === 0} className="mt-1 size-4 accent-action" />
            <span>
              <span className="block font-semibold">{a.label}</span>
              <span className="block text-small text-ink-2">{a.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>
      {state?.message && (
        <p role="alert" className="text-small text-danger">
          {state.message}
        </p>
      )}
      <div>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </div>
    </form>
  );
}
