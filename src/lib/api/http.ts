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

/**
 * Thin fetch wrapper for the real backend. Not wired yet: jarlore-be has no implementation.
 * When it exists, implement JarloreApi on top of this in ./http-api.ts and switch ./index.ts.
 */
export async function request<T>(
  path: string,
  init: RequestInit & { token?: string; idempotencyKey?: string } = {},
): Promise<T> {
  const base = process.env.JARLORE_API_URL;
  if (!base) throw new Error("JARLORE_API_URL is not set");
  const { token, idempotencyKey, headers, ...rest } = init;
  const res = await fetch(`${base}/v1${path}`, {
    ...rest,
    headers: {
      Accept: "application/json",
      ...(rest.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      ...headers,
    },
  });
  if (!res.ok) {
    const problem = (await res.json().catch(() => null)) as Problem | null;
    throw new ApiError(
      problem ?? { type: "about:blank", title: res.statusText, status: res.status, code: "http_error" },
    );
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}
