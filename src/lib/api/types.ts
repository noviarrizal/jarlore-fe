/**
 * Jarlore API contract types (v1).
 * Mirrors jarlore-be/docs/api/openapi.yaml. If they disagree, the OpenAPI spec wins:
 * update this file to match the spec. Never change the spec from here.
 */

export type ID = string;
export type ISODateTime = string;

export type FermentationTypeId = "kombucha" | "water_kefir" | "custom";

export interface FermentationType {
  id: FermentationTypeId;
  name: string;
  stages: { key: "f1" | "f2" | "ferment"; label: string; typicalDays: [number, number] }[];
}

export type BatchStatus = "active" | "finished" | "discarded";
export type BatchStage = "f1" | "f2" | "done";

export interface Ingredient {
  id: ID;
  name: string;
  role: "water" | "tea" | "sugar" | "starter" | "flavor" | "other";
  amount: number;
  unit: string;
}

export interface Addition {
  name: string;
  form: "juice" | "puree" | "chunks" | "whole" | "syrup" | "dried" | "other";
  amount: number | null;
  unit: string | null;
}

export interface Measurement {
  definitionKey: string;
  value: number;
  unit: string;
  method: string | null;
}

export interface MeasurementDefinition {
  id: ID;
  key: string;
  label: string;
  unit: string;
  decimals: number;
  min: number | null;
  max: number | null;
  isSystem: boolean;
}

export type Score = 1 | 2 | 3 | 4 | 5;

export interface Rating {
  overall: Score;
  fizz: Score | null;
  sweetTart: Score | null;
  flavor: Score | null;
  offNotes: string[];
  wouldRepeat: boolean | null;
  note: string | null;
}

export interface RecipeVersionRef {
  recipeId: ID;
  recipeName: string;
  versionId: ID;
  versionNo: number;
}

export type BottleStatus = "conditioning" | "chilled" | "finished" | "discarded";

export interface Bottle {
  id: ID;
  batchId: ID;
  label: string;
  flavorName: string;
  volumeMl: number;
  additions: Addition[];
  primingSugarG: number | null;
  headspaceCm: number | null;
  status: BottleStatus;
  startedAt: ISODateTime;
  finishedAt: ISODateTime | null;
  lastMeasurements: Measurement[];
  rating: Rating | null;
}

export type LogKind = "note" | "taste" | "burp" | "measure" | "stage_change" | "feed" | "issue";

export interface LogEntry {
  id: ID;
  batchId: ID;
  bottleId: ID | null;
  kind: LogKind;
  occurredAt: ISODateTime;
  note: string | null;
  measurements: Measurement[];
  createdAt: ISODateTime;
}

export type ReminderKind = "taste_check" | "bottle" | "burp" | "chill" | "custom";

export interface Reminder {
  id: ID;
  batchId: ID;
  bottleId: ID | null;
  kind: ReminderKind;
  dueAt: ISODateTime;
  status: "pending" | "done" | "snoozed" | "dismissed";
  label: string;
}

export interface BatchParams {
  targetF1Days?: number;
  roomTempC?: number;
  starterSource?: string;
}

export interface Batch {
  id: ID;
  code: string;
  name: string;
  fermentationTypeId: FermentationTypeId;
  status: BatchStatus;
  stage: BatchStage;
  archivedAt: ISODateTime | null;
  startedAt: ISODateTime;
  finishedAt: ISODateTime | null;
  volumeMl: number;
  vessel: string | null;
  recipeVersion: RecipeVersionRef | null;
  ingredients: Ingredient[];
  params: BatchParams;
  parentBatchId: ID | null;
  hypothesis: string | null;
  isReference: boolean;
  rating: Rating | null;
  bottles: Bottle[];
  lastLog: LogEntry | null;
  nextReminder: Reminder | null;
}

export type BatchSummary = Omit<Batch, "ingredients" | "params" | "bottles"> & {
  bottleCount: number;
};

export interface RecipeVersion {
  id: ID;
  recipeId: ID;
  versionNo: number;
  parentVersionId: ID | null;
  changeNote: string | null;
  sourceBatchId: ID | null;
  ingredients: Ingredient[];
  params: BatchParams;
  defaultBottles: { flavorName: string; additions: Addition[]; primingSugarG: number | null }[];
  createdAt: ISODateTime;
  batchCount: number;
  avgOverall: number | null;
}

export interface Recipe {
  id: ID;
  name: string;
  fermentationTypeId: FermentationTypeId;
  latestVersion: RecipeVersion;
  versionCount: number;
  batchCount: number;
  avgOverall: number | null;
  archivedAt: ISODateTime | null;
  createdAt: ISODateTime;
}

export type DiffValue = string | number | null;

export interface DiffRow {
  key: string;
  label: string;
  group: "ingredients" | "params" | "additions" | "process" | "measurements" | "result";
  values: DiffValue[];
  unit: string | null;
  differs: boolean;
  direction: ("up" | "down" | "same" | null)[];
}

export interface CompareItemRef {
  type: "batch" | "bottle";
  id: ID;
}

export interface CompareResult {
  items: { ref: CompareItemRef; title: string; subtitle: string; isReference: boolean }[];
  rows: DiffRow[];
}

export interface Page<T> {
  data: T[];
  nextCursor: string | null;
}

export interface TodayView {
  active: BatchSummary[];
  due: Reminder[];
  recentlyFinished: BatchSummary[];
}

export interface Entitlements {
  plan: "free" | "pro";
  limits: { compareItems: number; customMeasurements: number };
  source: string | null;
}

/** RFC 9457 problem details, as returned by every non-2xx response. */
export interface Problem {
  type: string;
  title: string;
  status: number;
  detail?: string;
  code: string;
  errors?: { field: string; code: string; message: string }[];
  requestId?: string;
}

export type BatchSort = "started_desc" | "started_asc" | "rating_desc" | "updated_desc";

export interface BatchQuery {
  status?: BatchStatus;
  stage?: BatchStage;
  type?: FermentationTypeId;
  recipeId?: ID;
  q?: string;
  archived?: boolean;
  sort?: BatchSort;
  cursor?: string;
  limit?: number;
}

export interface CreateBatchRequest {
  fermentationTypeId: FermentationTypeId;
  name?: string;
  startedAt?: ISODateTime;
  volumeMl: number;
  vessel?: string | null;
  ingredients: Ingredient[];
  params: BatchParams;
  source?: { type: "recipe_version"; id: ID } | { type: "batch"; id: ID };
  hypothesis?: string | null;
}

export interface BrewAgainDraft {
  draft: CreateBatchRequest;
  base: { ref: CompareItemRef; title: string };
  recipeVersion: RecipeVersionRef | null;
}

export interface Profile {
  displayName: string;
  unitSystem: "metric" | "us";
  tempUnit: "C" | "F";
  timezone: string;
  plan: "free" | "pro";
}

export interface CreateLogRequest {
  kind: LogKind;
  occurredAt?: ISODateTime;
  note?: string | null;
  measurements?: Measurement[];
  bottleId?: ID | null;
  /** "Burp all": one entry per bottle. */
  bottleIds?: ID[];
}
