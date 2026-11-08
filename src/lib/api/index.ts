import "server-only";
import type { JarloreApi } from "./contract";
import { httpApi } from "./http-api";

/**
 * The single entry point screens use to talk to jarlore-be (server only).
 * Every screen reads real data: there is no mock fallback, so a missing or
 * unreachable backend shows an error state instead of invented data.
 */
export const api: JarloreApi = httpApi;

export { ApiError, ApiUnavailableError, isNotFound } from "./http";
export type * from "./types";
