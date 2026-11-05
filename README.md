# jarlore-fe

The web app for **Jarlore**, a personal fermentation workspace: track every batch, learn from every experiment, recreate your best ferments.

Next.js 16 (App Router, Cache Components) · React 19 · Tailwind CSS 4 · TypeScript. Mobile-first PWA target.

> Data currently comes from in-memory mock fixtures in `src/mocks` (one demo brewer's kitchen), because `jarlore-be` has no implementation yet. Nothing persists across server restarts.

## Run

```bash
pnpm install
pnpm dev          # http://localhost:3000 — the app lives at /today
pnpm lint
pnpm build
```

## Docs

- `docs/design/DESIGN_FOUNDATIONS.md`: visual direction, tokens, type, colour meaning
- `docs/design/COMPONENT_SYSTEM.md`: components, states, accessibility
- `docs/design/SCREEN_GUIDELINES.md`: screens, layout, flows, review checklist
- `docs/architecture/FRONTEND_ARCHITECTURE.md`: structure, data flow, API integration, contract gaps
- `CLAUDE.md`: conventions every change must follow
- API contract: `../jarlore-be/docs/api/openapi.yaml`
