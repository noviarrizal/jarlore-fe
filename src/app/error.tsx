"use client"; // Error boundaries must be Client Components

import { ErrorScreen } from "@/components/app/error-screen";

/** Errors outside the app shell (landing, sign-in). */
export default function RootError({ error, retry }: { error: unknown; retry: () => void }) {
  return <ErrorScreen error={error} retry={retry} fullPage />;
}
