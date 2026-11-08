import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests against a real stack: PostgreSQL → jarlore-be (Go API) → this app.
 *
 * Required: E2E_DATABASE_URL, the API's runtime URL (role jarlore_api) for a
 * DISPOSABLE, migrated database: a local or CI PostgreSQL, or a Neon branch that is
 * not production. The tests create users and data on every run.
 *
 * Sign-in uses jarlore-be's local test issuer (cmd/devauth, loopback only) and the
 * app's development sign-in, so `next dev` is used: development sign-in is disabled
 * in production builds by design. Stop your own `pnpm dev` first (Next allows one
 * dev server per project). See e2e/README.md.
 */
const BE_DIR = process.env.JARLORE_BE_DIR ?? "../jarlore-be";
const API_PORT = process.env.E2E_API_PORT ?? "18080";
const WEB_PORT = process.env.E2E_WEB_PORT ?? "3100";
const DEVAUTH = "http://127.0.0.1:9999";
const CI = Boolean(process.env.CI);

const db = process.env.E2E_DATABASE_URL ?? "";
if (!db) {
  throw new Error("Set E2E_DATABASE_URL to the API role's URL of a disposable, migrated database (see e2e/README.md).");
}
{
  const host = new URL(db).hostname;
  const forbidden = (process.env.JARLORE_PRODUCTION_DB_HOSTS ?? "").split(",").map((h) => h.trim()).filter(Boolean);
  if (forbidden.some((h) => host === h || host.startsWith(`${h.split(".")[0]}-pooler.`) || host === h.replace("-pooler.", "."))) {
    throw new Error(`E2E_DATABASE_URL points at a production database host (${host}). Use a disposable database.`);
  }
  if (host.endsWith(".neon.tech") && process.env.E2E_NEON_BRANCH_IS_DISPOSABLE !== "1") {
    throw new Error("E2E_DATABASE_URL is a Neon host. Set E2E_NEON_BRANCH_IS_DISPOSABLE=1 only for a non-production branch.");
  }
}

export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: CI ? 1 : 0,
  forbidOnly: CI,
  reporter: CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...(process.env.E2E_BROWSER_CHANNEL ? { channel: process.env.E2E_BROWSER_CHANNEL } : {}),
  },
  projects: [{ name: "mobile-chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 } } }],
  webServer: [
    {
      command: "go run ./cmd/devauth",
      cwd: BE_DIR,
      url: `${DEVAUTH}/.well-known/jwks.json`,
      reuseExistingServer: !CI,
      timeout: 120_000,
    },
    {
      command: "go run ./cmd/api",
      cwd: BE_DIR,
      url: `http://127.0.0.1:${API_PORT}/health/ready`,
      reuseExistingServer: false,
      timeout: 180_000,
      env: {
        APP_ENV: "test",
        LOG_LEVEL: "warn",
        PORT: API_PORT,
        DATABASE_URL: db,
        AUTH_ISSUER: DEVAUTH,
        AUTH_JWKS_URL: `${DEVAUTH}/.well-known/jwks.json`,
        FRONTEND_ORIGIN: `http://localhost:${WEB_PORT}`,
      },
    },
    {
      command: `pnpm exec next dev --port ${WEB_PORT}`,
      url: `http://localhost:${WEB_PORT}/login`,
      reuseExistingServer: false,
      timeout: 240_000,
      env: {
        JARLORE_API_URL: `http://127.0.0.1:${API_PORT}`,
        JARLORE_DEV_AUTH_URL: DEVAUTH,
        // Development sign-in only: never mint real Neon Auth sessions in tests.
        NEON_AUTH_BASE_URL: "",
        NEON_AUTH_COOKIE_SECRET: "",
      },
    },
  ],
});

