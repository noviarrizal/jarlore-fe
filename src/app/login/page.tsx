import type { Metadata } from "next";
import { Suspense } from "react";
import { Wordmark } from "@/components/app/nav";
import { SignInForm } from "@/features/auth/sign-in-form";
import { devAuthUrl } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  const dev = devAuthUrl() !== null;
  return (
    <main className="mx-auto flex min-h-dvh max-w-content flex-col justify-center px-4 py-10">
      <Wordmark />
      <h1 className="mt-8 text-title md:text-title-lg">Sign in</h1>
      {dev ? (
        <Suspense>
          <SignInForm />
        </Suspense>
      ) : (
        <p className="mt-3 max-w-prose text-body text-ink-2">
          Email sign-in isn&apos;t connected on this server yet. Ask whoever runs it to set up Supabase Auth, or run Jarlore locally with
          the development sign-in.
        </p>
      )}
    </main>
  );
}
