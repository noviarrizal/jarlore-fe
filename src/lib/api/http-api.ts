import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getAccessToken } from "@/lib/auth/session";
import type { JarloreApi } from "./contract";
import { ApiError, request } from "./http";
import type {
  Batch,
  BatchSummary,
  Bottle,
  BrewAgainDraft,
  CompareResult,
  DiffResult,
  Entitlements,
  FermentationType,
  LogEntry,
  Me,
  MeasurementDefinition,
  Page,
  Recipe,
  RecipeVersion,
  RecipeVersionDetail,
  Reminder,
  TodayView,
} from "./types";

type Init = { method?: string; json?: unknown; idempotencyKey?: string };

/** Calls jarlore-be with the signed-in user's token. An expired session goes back to sign-in. */
async function call<T>(path: string, init: Init = {}): Promise<T> {
  const token = await getAccessToken();
  try {
    return await request<T>(path, { ...init, token });
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) redirect("/login?expired=1");
    throw e;
  }
}

const qs = (params: Record<string, string | number | boolean | undefined>) => {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") s.set(k, String(v));
  const out = s.toString();
  return out ? `?${out}` : "";
};

export const httpApi: JarloreApi = {
  async now() {
    await connection(); // request time, not build time
    return new Date().toISOString();
  },
  async getMe() {
    const [me, ent] = await Promise.all([call<Me>("/v1/me"), call<Entitlements>("/v1/entitlements")]);
    return {
      displayName: me.displayName ?? me.email?.split("@")[0] ?? "You",
      email: me.email ?? null,
      unitSystem: me.unitSystem,
      tempUnit: me.tempUnit,
      timezone: me.timezone,
      plan: ent.plan,
    };
  },
  getEntitlements: () => call<Entitlements>("/v1/entitlements"),
  listFermentationTypes: async () => (await call<{ data: FermentationType[] }>("/v1/fermentation-types")).data,
  listMeasurementDefinitions: async () => (await call<{ data: MeasurementDefinition[] }>("/v1/measurement-definitions")).data,
  getToday: () => call<TodayView>("/v1/today"),
  listBatches: (q = {}) =>
    call<Page<BatchSummary>>(
      `/v1/batches${qs({ status: q.status, stage: q.stage, type: q.type, recipeId: q.recipeId, q: q.q, archived: q.archived, sort: q.sort, cursor: q.cursor, limit: q.limit ?? 100 })}`,
    ),
  getBatch: (id) => call<Batch>(`/v1/batches/${encodeURIComponent(id)}`),
  listBatchLogs: (id) => call<Page<LogEntry>>(`/v1/batches/${encodeURIComponent(id)}/logs?limit=100`),
  listBatchReminders: async (id) => (await call<Page<Reminder>>(`/v1/reminders${qs({ batchId: id })}`)).data,
  getBatchReference: async (id) => (await call<{ batch: BatchSummary | null }>(`/v1/batches/${encodeURIComponent(id)}/reference`)).batch,
  getBrewAgainDraft: (id) => call<BrewAgainDraft>(`/v1/batches/${encodeURIComponent(id)}/brew-again`),
  listRecipes: (scope) => call<Page<Recipe>>(`/v1/recipes${qs({ scope, limit: 100 })}`),
  getRecipe: (id) => call<Recipe>(`/v1/recipes/${encodeURIComponent(id)}`),
  listRecipeVersions: async (id) => (await call<Page<RecipeVersion>>(`/v1/recipes/${encodeURIComponent(id)}/versions?limit=100`)).data,
  listRecipeBatches: (id) => call<Page<BatchSummary>>(`/v1/recipes/${encodeURIComponent(id)}/batches?limit=100`),
  diffRecipeVersions: (id, from, to) => call<DiffResult>(`/v1/recipes/${encodeURIComponent(id)}/diff${qs({ from, to })}`),
  compare: (items) => call<CompareResult>("/v1/compare", { method: "POST", json: { items } }),
  diffPreview: (base, draft) => call<DiffResult>("/v1/batches/diff-preview", { method: "POST", json: { base, draft } }),
  bottleDiffPreview: (base, draft) => call<DiffResult>("/v1/bottles/diff-preview", { method: "POST", json: { base, draft } }),
  getRecipeVersion: (id) => call<RecipeVersionDetail>(`/v1/recipe-versions/${encodeURIComponent(id)}`),
  async getBatchTemplate(type) {
    const t = (await httpApi.listFermentationTypes()).find((x) => x.id === type);
    return { volumeMl: t?.defaultVolumeMl ?? 1000, ingredients: t?.defaultIngredients ?? [], params: t?.defaultParams ?? {} };
  },

  createBatch: (input, key) => call<Batch>("/v1/batches", { method: "POST", json: input, idempotencyKey: key }),
  createLog: async (batchId, input, key) =>
    (await call<{ data: LogEntry[] }>(`/v1/batches/${encodeURIComponent(batchId)}/logs`, { method: "POST", json: input, idempotencyKey: key })).data,
  createBottles: (batchId, input, key) =>
    call<Batch>(`/v1/batches/${encodeURIComponent(batchId)}/bottles`, { method: "POST", json: input, idempotencyKey: key }),
  updateBottle: (id, input) => call<Bottle>(`/v1/bottles/${encodeURIComponent(id)}`, { method: "PATCH", json: input }),
  finishBottle: (id, input, key) => call<Bottle>(`/v1/bottles/${encodeURIComponent(id)}/finish`, { method: "POST", json: input, idempotencyKey: key }),
  finishBatch: (id, input, key) => call<Batch>(`/v1/batches/${encodeURIComponent(id)}/finish`, { method: "POST", json: input, idempotencyKey: key }),
  saveBatchAsRecipe: (id, input, key) =>
    call<Recipe>(`/v1/batches/${encodeURIComponent(id)}/save-as-recipe`, { method: "POST", json: input, idempotencyKey: key }),
  saveBottleAsRecipe: (id, input, key) =>
    call<Recipe>(`/v1/bottles/${encodeURIComponent(id)}/save-as-recipe`, { method: "POST", json: input, idempotencyKey: key }),
};
