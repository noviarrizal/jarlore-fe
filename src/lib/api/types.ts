/**
 * Jarlore API contract types (v1).
 * Generated from jarlore-be/api/openapi.yaml into ./schema.d.ts (`pnpm gen:api`).
 * Never edit schema.d.ts by hand; this file only gives the generated shapes short names.
 */
import type { components } from "./schema";

type S = components["schemas"];

export type ID = string;
export type ISODateTime = string;

export type FermentationTypeId = S["FermentationTypeId"];
export type FermentationType = S["FermentationType"];
export type BatchStatus = S["BatchStatus"];
export type BatchStage = S["BatchStage"];
export type BottleStatus = S["BottleStatus"];
export type LogKind = S["LogKind"];
export type ReminderKind = S["ReminderKind"];
export type RecipeScope = S["RecipeScope"];

export type IngredientInput = S["IngredientInput"];
export type Ingredient = S["Ingredient"];
export type Addition = S["Addition"];
export type Measurement = S["Measurement"];
export type MeasurementDefinition = S["MeasurementDefinition"];
export type Rating = S["Rating"];
export type Score = 1 | 2 | 3 | 4 | 5;
export type BatchParams = S["BatchParams"];
export type RecipeVersionRef = S["RecipeVersionRef"];

export type Bottle = S["Bottle"];
export type BottleInput = S["BottleInput"];
export type BottleSpec = S["BottleSpec"];
export type LogEntry = S["LogEntry"];
export type Reminder = S["Reminder"];
export type Batch = S["Batch"];
export type BatchSummary = S["BatchSummary"];
export type RecipeVersion = S["RecipeVersion"];
export type RecipeVersionDetail = S["RecipeVersionDetail"];
export type Recipe = S["Recipe"];

export type DiffRow = S["DiffRow"];
export type DiffValue = DiffRow["values"][number];
export type DiffResult = S["DiffResult"];
export type CompareItemRef = S["CompareItemRef"];
export type CompareResult = S["CompareResult"];
export type TodayView = S["TodayResponse"];
export type Entitlements = S["Entitlements"];
export type Problem = S["Problem"];
export type Me = S["Me"];

export type CreateBatchRequest = S["CreateBatchRequest"];
export type CreateLogRequest = S["CreateLogRequest"];
export type CreateBottlesRequest = S["CreateBottlesRequest"];
export type UpdateBottleRequest = S["UpdateBottleRequest"];
export type UpdateMeRequest = S["UpdateMeRequest"];
export type FinishRequest = S["FinishBottleRequest"];
export type SaveAsRecipeRequest = S["SaveAsRecipeRequest"];
export type BrewAgainDraft = S["BrewAgainResponse"];

export interface Page<T> {
  data: T[];
  nextCursor: string | null;
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

/** The profile plus the plan, as the Me screen shows it (GET /v1/me + GET /v1/entitlements). */
export interface Profile {
  displayName: string;
  /** The name the user set, or null (displayName then falls back to the email). */
  savedName: string | null;
  email: string | null;
  unitSystem: Me["unitSystem"];
  tempUnit: Me["tempUnit"];
  timezone: string;
  plan: Entitlements["plan"];
}
