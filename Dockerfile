# syntax=docker/dockerfile:1
# Jarlore web app for Cloud Run: the Next.js standalone server on distroless Node,
# running as non-root. The image holds no secrets; every setting is an environment
# variable read at request time (JARLORE_API_URL, NEON_AUTH_BASE_URL,
# NEON_AUTH_COOKIE_SECRET). Build: docker build -t jarlore-web .

FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# distroless Node: no shell or package manager in the runtime image.
FROM gcr.io/distroless/nodejs22-debian12:nonroot
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=8080
COPY --from=build --chown=nonroot:nonroot /app/.next/standalone ./
COPY --from=build --chown=nonroot:nonroot /app/.next/static ./.next/static
COPY --from=build --chown=nonroot:nonroot /app/public ./public
USER nonroot:nonroot
EXPOSE 8080
CMD ["server.js"]
