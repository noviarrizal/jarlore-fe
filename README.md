# jarlore-fe

The web app for **Jarlore**, a personal fermentation workspace: track every batch, learn from every experiment, recreate your best ferments.

Next.js 16 (App Router, Cache Components) · React 19 · Tailwind CSS 4 · TypeScript. Mobile-first PWA target.

Every screen reads and writes the Go API in `../jarlore-be` (Neon PostgreSQL in production). There is no mock data: without a reachable API the app shows its error states.

## Run

```bash
pnpm install
cp .env.example .env.local   # JARLORE_API_URL; NEON_AUTH_* (dev branch) and/or JARLORE_DEV_AUTH_URL
pnpm dev                     # http://localhost:3000 → /login → /today
```

Start jarlore-be first (its README: database, `go run ./cmd/devauth`, `go run ./cmd/api`). Sign in with an emailed code (Neon Auth, use the `dev` branch's Auth URL locally) or, in development only, with the local test issuer.

Checks (all run in CI, `.github/workflows/ci.yml`):

```bash
pnpm lint
pnpm typecheck
pnpm test:unit               # Node's test runner: time zones, session helpers
pnpm check:api-types         # generated types match ../jarlore-be/api/openapi.yaml (pnpm gen:api to update)
pnpm build
pnpm e2e                     # Playwright against a disposable database, see e2e/README.md
```

Deployment: Cloud Run, next to the API (`docs/deployment/FRONTEND_HOSTING.md`). Nothing is deployed yet.

## Docs

- `docs/design/DESIGN_FOUNDATIONS.md`: visual direction, tokens, type, colour meaning
- `docs/design/COMPONENT_SYSTEM.md`: components, states, accessibility
- `docs/design/SCREEN_GUIDELINES.md`: screens, layout, flows, review checklist
- `docs/architecture/FRONTEND_ARCHITECTURE.md`: structure, data flow, API integration, authentication, time zones, errors, security headers
- `docs/deployment/FRONTEND_HOSTING.md`: hosting choice and deploy steps
- `e2e/README.md`: end-to-end tests
- `CLAUDE.md`: conventions every change must follow
- API contract: `../jarlore-be/api/openapi.yaml`
