"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";

/**
 * Shared body of the error boundaries. Server errors reach the browser as a
 * generic error with a `digest` (Next.js strips the message in production), so the
 * copy never shows internals; the digest matches the server log line.
 */
export function ErrorScreen({ error, retry, fullPage = false }: { error: unknown; retry: () => void; fullPage?: boolean }) {
  const digest = typeof error === "object" && error && "digest" in error ? String((error as { digest?: unknown }).digest ?? "") : "";
  useEffect(() => {
    console.error("Jarlore page error", digest ? { digest } : error);
  }, [error, digest]);

  return (
    <div className={fullPage ? "mx-auto flex min-h-dvh max-w-content flex-col justify-center px-4" : "py-8"}>
      <div role="alert">
        <h1 className="text-title">This page didn&apos;t load</h1>
        <p className="mt-2 max-w-prose text-body text-ink-2">
          Jarlore couldn&apos;t reach your notebook just now. It may be waking up; trying again usually works. Nothing you saved before
          is affected.
        </p>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => retry()}>
          Try again
        </Button>
        <ButtonLink href="/today">Go to Today</ButtonLink>
      </div>
      {digest && <p className="mt-6 text-small text-ink-3">Reference {digest}</p>}
    </div>
  );
}
