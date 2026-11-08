"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { api } from "@/lib/api";
import { ApiError } from "@/lib/api/http";
import type {
  BottleInput,
  CompareItemRef,
  CreateBatchRequest,
  CreateBottlesRequest,
  CreateLogRequest,
  FinishRequest,
  SaveAsRecipeRequest,
  UpdateBottleRequest,
} from "@/lib/api/types";

/**
 * Server actions are the only way client components talk to the API.
 * They return plain results instead of throwing, so the UI can show a precise message.
 */
type Result<T> = { ok: true; data: T } | { ok: false; message: string; code: string };

async function run<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    unstable_rethrow(e); // redirects (e.g. an expired session) are not errors
    if (e instanceof ApiError) {
      const field = e.problem.errors?.[0]?.message;
      return { ok: false, message: field && field !== e.message ? `${e.message} ${field}` : e.message, code: e.code };
    }
    return { ok: false, message: "Couldn't reach Jarlore. Check your connection and try again.", code: "network" };
  }
}

export async function listMeasurementDefinitions() {
  return run(() => api.listMeasurementDefinitions());
}

export async function logEntry(batchId: string, input: CreateLogRequest, idempotencyKey: string) {
  return run(() => api.createLog(batchId, input, idempotencyKey));
}

export async function previewDiff(base: CompareItemRef | { type: "recipe_version"; id: string }, draft: CreateBatchRequest) {
  return run(() => api.diffPreview(base, draft));
}

export async function previewBottle(base: { type: "bottle" | "recipe_version"; id: string }, draft: BottleInput) {
  return run(() => api.bottleDiffPreview(base, draft));
}

export async function startBatch(input: CreateBatchRequest, idempotencyKey: string) {
  const res = await run(() => api.createBatch(input, idempotencyKey));
  if (res.ok) redirect(`/batches/${res.data.id}?started=1`);
  return res;
}

export async function bottleBatch(batchId: string, input: CreateBottlesRequest, idempotencyKey: string) {
  const res = await run(() => api.createBottles(batchId, input, idempotencyKey));
  if (res.ok) redirect(`/batches/${batchId}/bottles`);
  return res;
}

export async function finishBottle(bottleId: string, input: FinishRequest, idempotencyKey: string) {
  return run(() => api.finishBottle(bottleId, input, idempotencyKey));
}

export async function finishBatch(batchId: string, input: FinishRequest, idempotencyKey: string) {
  return run(() => api.finishBatch(batchId, input, idempotencyKey));
}

export async function updateBottle(bottleId: string, input: UpdateBottleRequest) {
  return run(() => api.updateBottle(bottleId, input));
}

export async function saveAsRecipe(
  target: { type: "batch" | "bottle"; id: string },
  input: SaveAsRecipeRequest,
  idempotencyKey: string,
) {
  return run(() =>
    target.type === "batch" ? api.saveBatchAsRecipe(target.id, input, idempotencyKey) : api.saveBottleAsRecipe(target.id, input, idempotencyKey),
  );
}
