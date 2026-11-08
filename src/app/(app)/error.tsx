"use client"; // Error boundaries must be Client Components

import { ErrorScreen } from "@/components/app/error-screen";

/** Errors inside the signed-in app keep the navigation around them. */
export default function AppError({ error, retry }: { error: unknown; retry: () => void }) {
  return <ErrorScreen error={error} retry={retry} />;
}
