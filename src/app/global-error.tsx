"use client"; // Error boundaries must be Client Components

/**
 * Last resort when the root layout itself fails. It renders its own document
 * without the app's stylesheet, so it uses a few inline styles with the paper and
 * ink colours of the design tokens (globals.css: --paper, --ink, --action).
 */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  const digest = typeof error === "object" && error && "digest" in error ? String((error as { digest?: unknown }).digest ?? "") : "";
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#f2f3ee", color: "#17302a", fontFamily: "system-ui, sans-serif" }}>
        <main role="alert" style={{ maxWidth: 560, margin: "0 auto", padding: "20vh 16px" }}>
          <h1 style={{ fontSize: 28, margin: 0 }}>Jarlore didn&apos;t load</h1>
          <p style={{ lineHeight: 1.5 }}>Something went wrong on our side. Trying again usually works. Nothing you saved before is affected.</p>
          <button
            type="button"
            onClick={() => retry()}
            style={{ minHeight: 44, padding: "0 16px", border: 0, borderRadius: 8, background: "#1f5c4c", color: "#fff", fontSize: 16 }}
          >
            Try again
          </button>
          {digest && <p style={{ fontSize: 14, opacity: 0.7 }}>Reference {digest}</p>}
        </main>
      </body>
    </html>
  );
}
