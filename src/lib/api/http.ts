import "server-only";
import type { Problem } from "./types";

/** Every non-2xx response from jarlore-be is RFC 9457 problem+json. */
export class ApiError extends Error {
  readonly problem: Problem;
  constructor(problem: Problem) {
    super(problem.detail ?? problem.title);
    this.name = "ApiError";
    this.problem = problem;
  }
  get status() {
    return this.problem.status;
  }
  get code() {
    return this.problem.code;
  }
}

export const isNotFound = (e: unknown) => e instanceof ApiError && e.status === 404;

/** Raised when the backend can't be reached at all (down, waking up, misconfigured). */
export class ApiUnavailableError extends Error {
  constructor(cause: unknown) {
    super("Jarlore's server can't be reached right now.", { cause });
    this.name = "ApiUnavailableError";
  }
}

export function apiBaseUrl(): string {
  const base = process.env.JARLORE_API_URL;
  if (!base) throw new Error("JARLORE_API_URL is not set. Point it at jarlore-be, e.g. http://localhost:8080.");
  return base.replace(/\/$/, "");
}

/**
 * fetch wrapper for jarlore-be. Server-side only: the access token never reaches
 * the browser. A Neon compute waking from idle can take a moment, so the timeout
 * is generous; nothing is retried automatically except by the user.
 */
export async function request<T>(
  path: string,
  init: Omit<RequestInit, "body"> & { token: string; idempotencyKey?: string; json?: unknown } ,
): Promise<T> {
  const { token, idempotencyKey, json, headers, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(`${apiBaseUrl()}${path}`, {
      ...rest,
      cache: "no-store",
      signal: rest.signal ?? AbortSignal.timeout(20_000),
      body: json === undefined ? undefined : JSON.stringify(json),
      headers: {
        Accept: "application/json",
        ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${token}`,
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
        ...headers,
      },
    });
  } catch (e) {
    throw new ApiUnavailableError(e);
  }
  if (!res.ok) {
    const problem = (await res.json().catch(() => null)) as Problem | null;
    throw new ApiError(
      problem ?? { type: "about:blank", title: res.statusText || "Request failed", status: res.status, code: "http_error", requestId: "" },
    );
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}
