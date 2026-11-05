import "server-only";
import { mockApi } from "@/mocks/api";
import type { JarloreApi } from "./contract";

/**
 * The single entry point screens use to read data (server components only).
 * Currently backed by mock fixtures because jarlore-be is not implemented yet.
 */
export const api: JarloreApi = mockApi;

export { ApiError, isNotFound } from "./http";
export type * from "./types";
