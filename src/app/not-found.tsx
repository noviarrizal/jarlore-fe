import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-content flex-col justify-center px-4">
      <h1 className="text-title">This page isn&apos;t here</h1>
      <p className="mt-2 text-body text-ink-2">It may have been deleted, or the link is wrong. Your batches are still on the Batches page.</p>
      <div className="mt-6">
        <ButtonLink href="/batches" variant="primary">
          Go to batches
        </ButtonLink>
      </div>
    </main>
  );
}
