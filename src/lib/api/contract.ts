import type {
  Batch,
  BatchQuery,
  BatchSummary,
  Bottle,
  BottleInput,
  BrewAgainDraft,
  CompareItemRef,
  CompareResult,
  CreateBatchRequest,
  CreateBottlesRequest,
  CreateLogRequest,
  DiffResult,
  Entitlements,
  FermentationType,
  FermentationTypeId,
  FinishRequest,
  ISODateTime,
  LogEntry,
  MeasurementDefinition,
  Page,
  Me,
  Profile,
  Recipe,
  RecipeScope,
  RecipeVersion,
  RecipeVersionDetail,
  Reminder,
  SaveAsRecipeRequest,
  TodayView,
  UpdateBottleRequest,
  UpdateMeRequest,
} from "./types";

/**
 * Everything the UI reads from and writes to the backend. Screens depend on this
 * interface, never on fetch(). Method names map 1:1 to /v1 endpoints.
 */
export interface JarloreApi {
  /** "Now" for day counts, taken when the page renders. */
  now(): Promise<ISODateTime>;
  getMe(): Promise<Profile>; // GET /v1/me + GET /v1/entitlements
  /** The user's IANA time zone, the zone every date and time is shown in. */
  timezone(): Promise<string>; // GET /v1/me
  updateMe(patch: UpdateMeRequest): Promise<Me>; // PATCH /v1/me
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
  listRecipes(scope?: RecipeScope): Promise<Page<Recipe>>; // GET /v1/recipes
  getRecipe(id: string): Promise<Recipe>; // GET /v1/recipes/{id}
  listRecipeVersions(recipeId: string): Promise<RecipeVersion[]>; // GET /v1/recipes/{id}/versions
  listRecipeBatches(recipeId: string): Promise<Page<BatchSummary>>; // GET /v1/recipes/{id}/batches
  diffRecipeVersions(recipeId: string, from: number, to: number): Promise<DiffResult>; // GET /v1/recipes/{id}/diff
  compare(items: CompareItemRef[]): Promise<CompareResult>; // POST /v1/compare
  diffPreview(base: CompareItemRef | { type: "recipe_version"; id: string }, draft: CreateBatchRequest): Promise<DiffResult>; // POST /v1/batches/diff-preview
  bottleDiffPreview(base: { type: "bottle" | "recipe_version"; id: string }, draft: BottleInput): Promise<DiffResult>; // POST /v1/bottles/diff-preview
  getRecipeVersion(versionId: string): Promise<RecipeVersionDetail>; // GET /v1/recipe-versions/{id}
  /** Starting point for a blank batch, from the fermentation type's defaults. */
  getBatchTemplate(type: FermentationTypeId): Promise<Pick<CreateBatchRequest, "volumeMl" | "ingredients" | "params">>;

  createBatch(input: CreateBatchRequest, idempotencyKey: string): Promise<Batch>; // POST /v1/batches
  createLog(batchId: string, input: CreateLogRequest, idempotencyKey: string): Promise<LogEntry[]>; // POST /v1/batches/{id}/logs
  createBottles(batchId: string, input: CreateBottlesRequest, idempotencyKey: string): Promise<Batch>; // POST /v1/batches/{id}/bottles
  updateBottle(bottleId: string, input: UpdateBottleRequest): Promise<Bottle>; // PATCH /v1/bottles/{id}
  finishBottle(bottleId: string, input: FinishRequest, idempotencyKey: string): Promise<Bottle>; // POST /v1/bottles/{id}/finish
  finishBatch(batchId: string, input: FinishRequest, idempotencyKey: string): Promise<Batch>; // POST /v1/batches/{id}/finish
  saveBatchAsRecipe(batchId: string, input: SaveAsRecipeRequest, idempotencyKey: string): Promise<Recipe>; // POST /v1/batches/{id}/save-as-recipe
  saveBottleAsRecipe(bottleId: string, input: SaveAsRecipeRequest, idempotencyKey: string): Promise<Recipe>; // POST /v1/bottles/{id}/save-as-recipe
}
