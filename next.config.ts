import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Content Security Policy, following Next.js's "without nonces" pattern
 * (node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md):
 * nonce-based CSP needs every page to render dynamically and is incompatible with
 * Partial Prerendering, which this app uses (cacheComponents). So inline scripts
 * (Next's RSC payload and bootstrap) are allowed with 'unsafe-inline', and
 * everything else is locked to this origin:
 * - The browser talks only to this app. jarlore-be and Neon Auth are called from
 *   the server, so connect-src needs no third-party origin.
 * - Fonts are self-hosted by next/font; images are local, data: or blob:.
 * - 'unsafe-eval' only in development (React's debugging needs it).
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // No upgrade-insecure-requests: every resource is same-origin and HSTS already
  // keeps the deployed site on https; the directive only breaks `next start` over
  // plain http on a laptop or in CI.
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Never render inside another site's frame (clickjacking); CSP frame-ancestors for
  // modern browsers, X-Frame-Options for old ones.
  { key: "X-Frame-Options", value: "DENY" },
  // Don't let the browser guess content types (MIME sniffing).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send only the origin to other sites; never paths such as /batches/<id>.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The app uses no camera, microphone, location, payment or USB.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  // HTTPS only, for a year, once deployed. Browsers ignore HSTS on plain http, and
  // it is left out of development so localhost is never pinned to https.
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]),
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // A self-contained server (node .next/standalone/server.js) for the container
  // image in Dockerfile; `next start` keeps working for local runs.
  output: "standalone",
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
