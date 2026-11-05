"use server";

import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { ApiError } from "@/lib/api/http";
import type { CompareItemRef, CreateBatchRequest, CreateLogRequest } from "@/lib/api/types";

/**
 * Server actions are the only way client components talk to the API.
 * They return plain results instead of throwing, so the UI can show a precise message.
 */
type Result<T> = { ok: true; data: T } | { ok: false; message: string; code: string };

async function run<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, message: e.message, code: e.code };
    return { ok: false, message: "Couldn't reach Jarlore. Check your connection and try again.", code: "network" };
  }
}

export async function logEntry(batchId: string, input: CreateLogRequest, idempotencyKey: string) {
  return run(() => api.createLog(batchId, input, idempotencyKey));
}

export async function previewDiff(base: CompareItemRef, draft: CreateBatchRequest) {
  return run(() => api.diffPreview(base, draft));
}

export async function startBatch(input: CreateBatchRequest, idempotencyKey: string) {
  const res = await run(() => api.createBatch(input, idempotencyKey));
  if (res.ok) redirect(`/batches/${res.data.id}?started=1`);
  return res;
}
