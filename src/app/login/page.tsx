import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Wordmark } from "@/components/app/nav";
import { EmailCodeForm } from "@/features/auth/email-code-form";
import { SignInForm } from "@/features/auth/sign-in-form";
import { neonAuth } from "@/lib/auth/neon";
import { devAuthUrl } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-content flex-col justify-center px-4 py-10">
      <Wordmark />
      <h1 className="mt-8 text-title md:text-title-lg">Sign in</h1>
      <Suspense>
        <SignInOptions />
      </Suspense>
    </main>
  );
}

/** Reads the deployment's configuration at request time, not at build time. */
async function SignInOptions() {
  await connection();
  const email = neonAuth() !== null;
  const dev = devAuthUrl() !== null;
  if (!email && !dev) {
    return (
      <p className="mt-3 max-w-prose text-body text-ink-2">
        Email sign-in isn&apos;t connected on this server yet. Ask whoever runs it to set up Neon Auth, or run Jarlore locally with the
        development sign-in.
      </p>
    );
  }
  return (
    <>
      {email && <EmailCodeForm />}
      {dev && (
        <section className={email ? "mt-10 border-t border-rule pt-6" : undefined} aria-label="Development sign-in">
          {email && <h2 className="text-section">Development</h2>}
          <SignInForm />
        </section>
      )}
    </>
  );
}
