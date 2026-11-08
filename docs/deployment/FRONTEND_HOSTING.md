# Frontend hosting

Decided 2026-11-08. **Nothing is deployed**; deploying needs the founder's approval and a GCP billing account.

## Requirements

The app is not a static site. It needs a Node server for:
- Server Components that read jarlore-be with the user's token (no browser → API calls);
- Server Actions for every write;
- `src/proxy.ts` on each app request (Neon Auth session check and JWT refresh into an httpOnly cookie);
- Partial Prerendering / Cache Components (Next.js 16).

It is a commercial product (paid plans are planned), so the host's free tier must allow commercial use.

## Options compared

| | Cloud Run (chosen) | Vercel | Netlify |
|---|---|---|---|
| SSR, Server Actions, proxy | Yes: a plain Node server (`output: "standalone"`) | Yes, native | Yes (Next.js runtime) |
| Commercial use on the free tier | Yes (pay-as-you-go with a free allowance) | **No**: Hobby is "personal, non-commercial use only"; Pro is per seat per month | Yes per Netlify's free plan announcement, but all sites pause when the monthly credits run out |
| Free allowance | Shared with the API: 180k vCPU-s, 360k GiB-s, 2M requests per billing account per month (Tier 1 pricing; Singapore is Tier 2) | — | Credit-based |
| Region | `asia-southeast1`, next to the API and Neon | Edge/regions of the platform | Platform regions |
| Cold start | Yes at min 0 (Node server, ~1 s; measure after first deploy) | Minimal | Some |
| Setup effort | Dockerfile + one service (same steps as the API) | Lowest | Low |
| Secrets | Secret Manager | Project env vars | Site env vars |
| Lock-in | None (any container host) | Some | Some |

**Recommendation: Cloud Run**, a second service `jarlore-web` beside `jarlore-api`. One provider, one region, one free allowance and one budget alert; no commercial-use restriction; the container runs anywhere later. If cold starts bother beta users, `min-instances 1` on the web service is the first lever (it bills around the clock; check the price first).

Sources checked 2026-11-08: Vercel Hobby plan and fair use guidelines (vercel.com/docs/plans/hobby, vercel.com/docs/limits/fair-use-guidelines), Netlify free plan announcement (netlify.com/blog/introducing-netlify-free-plan), Cloud Run pricing (cloud.google.com/run/pricing).

## Artifacts

| File | Purpose |
|---|---|
| `next.config.ts` | `output: "standalone"`, security headers, `poweredByHeader: false` |
| `Dockerfile` | `node:22-bookworm-slim` build → `distroless/nodejs22-debian12:nonroot` runtime, port 8080 |
| `.dockerignore` | Keeps `.env*`, `.git`, tests and docs out of the image |
| `deploy/cloudrun.service.yaml` | min 0, max 2, 1 vCPU / 512 MiB, concurrency 40, startup probe on `/login` |
| `.github/workflows/ci.yml`, job `container` | Builds the image, checks it runs as non-root, holds no `.env`, serves `/login` with the headers, redirects `/today` without a session |

## Environment

| Variable | Where | Value |
|---|---|---|
| `JARLORE_API_URL` | Plain env | The API's Cloud Run URL (or custom domain) |
| `NEON_AUTH_BASE_URL` | Plain env | Production branch Auth URL from the Neon console |
| `NEON_AUTH_COOKIE_SECRET` | Secret Manager | 32+ random characters (`openssl rand -base64 32`) |
| `JARLORE_DEV_AUTH_URL` | **Never in production** | Ignored there anyway |

Variables are read at request time (the sign-in page renders after `connection()`), so one image serves every environment.

## Deploy (when approved)

```bash
PROJECT_ID=... REGION=asia-southeast1
gcloud iam service-accounts create jarlore-web
openssl rand -base64 32 | tr -d '\n' | gcloud secrets create jarlore-neon-auth-cookie-secret --data-file=-
gcloud secrets add-iam-policy-binding jarlore-neon-auth-cookie-secret \
  --member=serviceAccount:jarlore-web@$PROJECT_ID.iam.gserviceaccount.com --role=roles/secretmanager.secretAccessor
gcloud builds submit --tag $REGION-docker.pkg.dev/$PROJECT_ID/jarlore/jarlore-web:$(git rev-parse --short HEAD)
# edit deploy/cloudrun.service.yaml placeholders, then
gcloud run services replace deploy/cloudrun.service.yaml --region $REGION
gcloud run services add-iam-policy-binding jarlore-web --region $REGION --member=allUsers --role=roles/run.invoker
```

Then, in order:
1. Set the API's `FRONTEND_ORIGIN` to the web URL.
2. Neon console → Auth → **trusted domains**: add the web URL (and the custom domain later); turn **Allow Localhost** off on the production branch.
3. Neon Auth production checklist: custom SMTP sender, email verification on, application name "Jarlore".
4. Smoke test: open `/login`, sign in with an email code, create a batch, sign out.
