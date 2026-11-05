import type {
  Batch,
  BatchQuery,
  BatchSummary,
  BrewAgainDraft,
  CompareItemRef,
  CompareResult,
  CreateBatchRequest,
  CreateLogRequest,
  DiffRow,
  Entitlements,
  FermentationType,
  FermentationTypeId,
  ISODateTime,
  LogEntry,
  MeasurementDefinition,
  Page,
  Profile,
  Recipe,
  RecipeVersion,
  Reminder,
  TodayView,
} from "./types";

/**
 * Everything the UI reads from the backend. Screens depend on this interface,
 * never on fetch() or on mocks directly. Method names map 1:1 to /v1 endpoints.
 */
export interface JarloreApi {
  /** Server "now" used for day counts. Mock returns a pinned time. */
  now(): Promise<ISODateTime>;
  getMe(): Promise<Profile>; // GET /v1/me
  getEntitlements(): Promise<Entitlements>; // GET /v1/entitlements
  listFermentationTypes(): Promise<FermentationType[]>; // GET /v1/fermentation-types
  listMeasurementDefinitions(): Promise<MeasurementDefinition[]>; // GET /v1/measurement-definitions
  getToday(): Promise<TodayView>; // GET /v1/today
  listBatches(query?: BatchQuery): Promise<Page<BatchSummary>>; // GET /v1/batches
  getBatch(id: string): Promise<Batch>; // GET /v1/batches/{id}
  listBatchLogs(batchId: string): Promise<Page<LogEntry>>; // GET /v1/batches/{id}/logs
  listBatchReminders(batchId: string): Promise<Reminder[]>; // GET /v1/reminders?batchId=
  getBatchReference(batchId: string): Promise<BatchSummary | null>; // GET /v1/batches/{id}/reference
  getBrewAgainDraft(batchId: string): Promise<BrewAgainDraft>; // GET /v1/batches/{id}/brew-again
  listRecipes(): Promise<Page<Recipe>>; // GET /v1/recipes
  getRecipe(id: string): Promise<Recipe>; // GET /v1/recipes/{id}
  listRecipeVersions(recipeId: string): Promise<RecipeVersion[]>; // GET /v1/recipes/{id}/versions
  listRecipeBatches(recipeId: string): Promise<Page<BatchSummary>>; // GET /v1/recipes/{id}/batches
  diffRecipeVersions(recipeId: string, from: number, to: number): Promise<{ rows: DiffRow[]; changeCount: number }>; // GET /v1/recipes/{id}/diff
  compare(items: CompareItemRef[]): Promise<CompareResult>; // POST /v1/compare
  diffPreview(base: CompareItemRef, draft: CreateBatchRequest): Promise<{ rows: DiffRow[]; changeCount: number }>; // POST /v1/batches/diff-preview
  createBatch(input: CreateBatchRequest, idempotencyKey: string): Promise<Batch>; // POST /v1/batches
  getRecipeVersion(versionId: string): Promise<RecipeVersion & { recipeName: string; fermentationTypeId: FermentationTypeId }>; // GET /v1/recipes/{id}/versions/{no}
  /** Starter ingredients for a blank batch. Gap: not in the OpenAPI yet (see FRONTEND_ARCHITECTURE.md). */
  getBatchTemplate(type: FermentationTypeId): Promise<Pick<CreateBatchRequest, "volumeMl" | "ingredients" | "params">>;
  createLog(batchId: string, input: CreateLogRequest, idempotencyKey: string): Promise<LogEntry[]>; // POST /v1/batches/{id}/logs
}
