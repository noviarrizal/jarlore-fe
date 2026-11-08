# jarlore-fe

The web app for **Jarlore**, a personal fermentation workspace: track every batch, learn from every experiment, recreate your best ferments.

Next.js 16 (App Router, Cache Components) · React 19 · Tailwind CSS 4 · TypeScript. Mobile-first PWA target.

Every screen reads and writes the Go API in `../jarlore-be` (Neon PostgreSQL in production). There is no mock data: without a reachable API the app shows its error states.

## Run

```bash
pnpm install
cp .env.example .env.local   # JARLORE_API_URL, and JARLORE_DEV_AUTH_URL for development sign-in
pnpm dev                     # http://localhost:3000 → /login → /today
pnpm lint
npx tsc --noEmit
pnpm build
pnpm gen:api                 # regenerate src/lib/api/schema.d.ts after the OpenAPI spec changes
```

Start jarlore-be first (its README: database, `go run ./cmd/devauth`, `go run ./cmd/api`).

## Docs

- `docs/design/DESIGN_FOUNDATIONS.md`: visual direction, tokens, type, colour meaning
- `docs/design/COMPONENT_SYSTEM.md`: components, states, accessibility
- `docs/design/SCREEN_GUIDELINES.md`: screens, layout, flows, review checklist
- `docs/architecture/FRONTEND_ARCHITECTURE.md`: structure, data flow, API integration, contract gaps
- `CLAUDE.md`: conventions every change must follow
- API contract: `../jarlore-be/api/openapi.yaml`
