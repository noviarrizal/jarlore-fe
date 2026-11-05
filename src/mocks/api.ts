/**
 * MOCK ONLY. In-memory implementation of JarloreApi backed by ./fixtures.
 * It mimics the contract's behaviour (filters, 404s, compare limits) closely enough to build screens against.
 */
import type { JarloreApi } from "@/lib/api/contract";
import { ApiError } from "@/lib/api/http";
import { connection } from "next/server";
import type { Batch, BatchSummary, Bottle, CompareItemRef, CompareResult, LogEntry } from "@/lib/api/types";
import { diffBatches, diffBottles, diffDraft, diffVersions } from "./diff";
import {
  MOCK_NOW,
  batchTemplates,
  batches,
  fermentationTypes,
  logs,
  measurementDefinitions,
  profile,
  recipeVersions,
  recipes,
  reminders,
} from "./fixtures";

/** Derived fields are recomputed on every read so new logs and completed reminders show up. */
function live(batch: Batch): Batch {
  const lastLog = logs.filter((l) => l.batchId === batch.id).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0] ?? null;
  const nextReminder =
    reminders.filter((r) => r.batchId === batch.id && r.status === "pending").sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0] ?? null;
  return { ...batch, lastLog, nextReminder };
}

const summary = (b: Batch): BatchSummary => {
  const { ingredients, params, bottles, ...rest } = live(b);
  void ingredients;
  void params;
  return { ...rest, bottleCount: bottles.length };
};

const notFound = (what: string) =>
  new ApiError({ type: "about:blank", title: "Not found", status: 404, code: "not_found", detail: `${what} not found` });

function findBottle(id: string): { bottle: Bottle; batch: Batch } | null {
  for (const batch of batches) {
    const bottle = batch.bottles.find((b) => b.id === id);
    if (bottle) return { bottle, batch };
  }
  return null;
}

const seenKeys = new Map<string, LogEntry[]>();
const createdBatches = new Map<string, Batch>();

const impl: JarloreApi = {
  async now() {
    return MOCK_NOW;
  },

  async getMe() {
    return profile;
  },

  async getEntitlements() {
    return { plan: "free", limits: { compareItems: 2, customMeasurements: 3 }, source: null };
  },

  async listFermentationTypes() {
    return fermentationTypes;
  },

  async listMeasurementDefinitions() {
    return measurementDefinitions;
  },

  async getToday() {
    const active = batches.filter((b) => b.status === "active").map(summary);
    const due = reminders
      .filter((r) => r.status === "pending" && r.dueAt <= "2026-11-05T23:59:59Z")
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
    const recentlyFinished = batches
      .filter((b) => b.status === "finished" && !b.archivedAt)
      .sort((a, b) => (b.finishedAt ?? "").localeCompare(a.finishedAt ?? ""))
      .slice(0, 3)
      .map(summary);
    return { active, due, recentlyFinished };
  },

  async listBatches(query = {}) {
    const q = query.q?.trim().toLowerCase();
    let data = batches.filter((b) => {
      if (query.archived !== undefined && Boolean(b.archivedAt) !== query.archived) return false;
      if (query.status && b.status !== query.status) return false;
      if (query.stage && b.stage !== query.stage) return false;
      if (query.type && b.fermentationTypeId !== query.type) return false;
      if (query.recipeId && b.recipeVersion?.recipeId !== query.recipeId) return false;
      if (q && !`${b.code} ${b.name} ${b.recipeVersion?.recipeName ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
    const sort = query.sort ?? "started_desc";
    data = [...data].sort((a, b) => {
      if (sort === "started_asc") return a.startedAt.localeCompare(b.startedAt);
      if (sort === "rating_desc") return (b.rating?.overall ?? 0) - (a.rating?.overall ?? 0);
      return b.startedAt.localeCompare(a.startedAt);
    });
    return { data: data.map(summary), nextCursor: null };
  },

  async getBatch(id) {
    const batch = batches.find((b) => b.id === id);
    if (!batch) throw notFound("Batch");
    return live(batch);
  },

  async listBatchLogs(batchId) {
    const data = logs
      .filter((l) => l.batchId === batchId)
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    return { data, nextCursor: null };
  },

  async listBatchReminders(batchId) {
    return reminders.filter((r) => r.batchId === batchId && r.status === "pending");
  },

  async getBatchReference(batchId) {
    const batch = batches.find((b) => b.id === batchId);
    if (!batch) throw notFound("Batch");
    const candidates = batches.filter(
      (b) =>
        b.id !== batch.id &&
        b.status === "finished" &&
        (batch.recipeVersion ? b.recipeVersion?.recipeId === batch.recipeVersion.recipeId : b.fermentationTypeId === batch.fermentationTypeId),
    );
    const pick =
      candidates.find((b) => b.isReference) ??
      candidates.filter((b) => (b.rating?.overall ?? 0) >= 4).sort((a, b) => (b.finishedAt ?? "").localeCompare(a.finishedAt ?? ""))[0];
    return pick ? summary(pick) : null;
  },

  async listRecipes() {
    return { data: recipes.filter((r) => !r.archivedAt), nextCursor: null };
  },

  async getRecipe(id) {
    const recipe = recipes.find((r) => r.id === id);
    if (!recipe) throw notFound("Recipe");
    return recipe;
  },

  async listRecipeVersions(recipeId) {
    return recipeVersions.filter((v) => v.recipeId === recipeId).sort((a, b) => b.versionNo - a.versionNo);
  },

  async listRecipeBatches(recipeId) {
    const data = batches
      .filter((b) => b.recipeVersion?.recipeId === recipeId)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      .map(summary);
    return { data, nextCursor: null };
  },

  async diffRecipeVersions(recipeId, from, to) {
    const versions = [from, to].map((no) => recipeVersions.find((v) => v.recipeId === recipeId && v.versionNo === no));
    if (versions.some((v) => !v)) throw notFound("Recipe version");
    const rows = diffVersions(versions as NonNullable<(typeof versions)[number]>[]);
    return { rows, changeCount: rows.filter((r) => r.differs).length };
  },

  async compare(items: CompareItemRef[]): Promise<CompareResult> {
    if (items.length < 2) {
      throw new ApiError({ type: "about:blank", title: "Pick at least two", status: 422, code: "validation_failed", detail: "Compare needs 2 to 6 items." });
    }
    const allBottles = items.every((i) => i.type === "bottle");
    if (allBottles) {
      const found = items.map((i) => findBottle(i.id));
      if (found.some((f) => !f)) throw notFound("Bottle");
      const pairs = found as { bottle: Bottle; batch: Batch }[];
      return {
        items: pairs.map(({ bottle, batch }) => ({
          ref: { type: "bottle", id: bottle.id },
          title: `${batch.code} ${bottle.label}`,
          subtitle: bottle.flavorName,
          isReference: false,
        })),
        rows: diffBottles(pairs.map((p) => p.bottle)),
      };
    }
    const found = items.map((i) => batches.find((b) => b.id === i.id));
    if (found.some((b) => !b) || items.some((i) => i.type !== "batch")) throw notFound("Batch");
    const list = found as Batch[];
    return {
      items: list.map((b) => ({ ref: { type: "batch", id: b.id }, title: b.code, subtitle: b.name, isReference: b.isReference })),
      rows: diffBatches(list),
    };
  },

  async diffPreview(base, draft) {
    const batch = batches.find((b) => b.id === base.id);
    if (!batch) throw notFound("Batch");
    const rows = diffDraft(batch, draft);
    return { rows, changeCount: rows.filter((r) => r.differs).length };
  },

  async createBatch(input, idempotencyKey) {
    const existing = createdBatches.get(idempotencyKey);
    if (existing) return existing;
    const prefix = input.fermentationTypeId === "kombucha" ? "KB" : input.fermentationTypeId === "water_kefir" ? "WK" : "CU";
    const next = Math.max(0, ...batches.filter((b) => b.code.startsWith(prefix)).map((b) => Number(b.code.slice(3)))) + 1;
    const sourceBatch = input.source?.type === "batch" ? batches.find((b) => b.id === input.source?.id) : undefined;
    const sourceVersion = input.source?.type === "recipe_version" ? recipeVersions.find((v) => v.id === input.source?.id) : undefined;
    const versionId = sourceBatch?.recipeVersion?.versionId ?? sourceVersion?.id;
    const v = versionId ? recipeVersions.find((x) => x.id === versionId) : undefined;
    const r = v ? recipes.find((x) => x.id === v.recipeId) : undefined;
    const batch: Batch = {
      id: `b-new-${Date.now()}`,
      code: `${prefix}-${String(next).padStart(3, "0")}`,
      name: input.name || r?.name || "Untitled batch",
      fermentationTypeId: input.fermentationTypeId,
      status: "active",
      stage: "f1",
      archivedAt: null,
      startedAt: input.startedAt ?? MOCK_NOW,
      finishedAt: null,
      volumeMl: input.volumeMl,
      vessel: input.vessel ?? null,
      recipeVersion: v && r ? { recipeId: r.id, recipeName: r.name, versionId: v.id, versionNo: v.versionNo } : null,
      ingredients: input.ingredients,
      params: input.params,
      parentBatchId: sourceBatch?.id ?? null,
      hypothesis: input.hypothesis ?? null,
      isReference: false,
      rating: null,
      bottles: [],
      lastLog: null,
      nextReminder: null,
    };
    batches.unshift(batch);
    createdBatches.set(idempotencyKey, batch);
    return batch;
  },

  async getRecipeVersion(versionId) {
    const v = recipeVersions.find((x) => x.id === versionId);
    const r = v && recipes.find((x) => x.id === v.recipeId);
    if (!v || !r) throw notFound("Recipe version");
    return { ...v, recipeName: r.name, fermentationTypeId: r.fermentationTypeId };
  },

  async getBatchTemplate(type) {
    const t = batchTemplates[type];
    return { volumeMl: t.volumeMl, ingredients: [...t.ingredients], params: { ...t.params } };
  },

  async createLog(batchId, input, idempotencyKey) {
    const existing = seenKeys.get(idempotencyKey);
    if (existing) return existing;
    const batch = batches.find((b) => b.id === batchId);
    if (!batch) throw notFound("Batch");
    if (batch.status !== "active") {
      throw new ApiError({ type: "about:blank", title: "Batch is finished", status: 409, code: "batch_not_active", detail: "Finished batches can't be logged." });
    }
    const occurredAt = input.occurredAt ?? MOCK_NOW;
    const bottleIds = input.bottleIds?.length ? input.bottleIds : [input.bottleId ?? null];
    const created = bottleIds.map((bottleId, i) => ({
      id: `l-${Date.now()}-${i}`,
      batchId,
      bottleId,
      kind: input.kind,
      occurredAt,
      note: input.note ?? null,
      measurements: input.measurements ?? [],
      createdAt: occurredAt,
    }));
    logs.push(...created);
    // Logging completes matching pending reminders (server-side rule in the real API).
    const kindFor = { burp: "burp", taste: "taste_check" } as const;
    const reminderKind = kindFor[input.kind as keyof typeof kindFor];
    for (const r of reminders) {
      if (r.batchId !== batchId || r.status !== "pending" || r.kind !== reminderKind || r.dueAt > "2026-11-05T23:59:59Z") continue;
      if (r.bottleId && !bottleIds.includes(r.bottleId)) continue;
      r.status = "done";
    }
    seenKeys.set(idempotencyKey, created);
    return created;
  },

  async getBrewAgainDraft(batchId) {
    const batch = batches.find((b) => b.id === batchId);
    if (!batch) throw notFound("Batch");
    return {
      base: { ref: { type: "batch", id: batch.id }, title: `${batch.code} ${batch.name}` },
      recipeVersion: batch.recipeVersion,
      draft: {
        fermentationTypeId: batch.fermentationTypeId,
        name: batch.name,
        volumeMl: batch.volumeMl,
        vessel: batch.vessel,
        ingredients: batch.ingredients,
        params: batch.params,
        source: { type: "batch", id: batch.id },
        hypothesis: null,
      },
    };
  },
};

/**
 * Every call opts into request-time rendering, like the real API will (it reads the auth cookie).
 * Without this, Next would prerender mock data at build time and hide Suspense/loading behaviour.
 */
export const mockApi = new Proxy(impl, {
  get(target, key: keyof JarloreApi) {
    const fn = target[key];
    return async (...args: unknown[]) => {
      await connection();
      return (fn as (...a: unknown[]) => Promise<unknown>)(...args);
    };
  },
}) as JarloreApi;
