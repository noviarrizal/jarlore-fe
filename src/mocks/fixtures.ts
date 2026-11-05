/**
 * Mock fixtures for building UI before jarlore-be exists.
 * One demo brewer's realistic kitchen, NOT real customer data.
 * Times are UTC and pinned to MOCK_NOW so server and client renders agree.
 */
import type {
  Addition,
  Batch,
  Bottle,
  FermentationType,
  Ingredient,
  LogEntry,
  Measurement,
  MeasurementDefinition,
  Rating,
  Recipe,
  RecipeVersion,
  Reminder,
} from "@/lib/api/types";

export const MOCK_NOW = "2026-11-05T09:00:00Z";

const at = (date: string, time = "08:00") => `${date}T${time}:00Z`;

export const fermentationTypes: FermentationType[] = [
  {
    id: "kombucha",
    name: "Kombucha",
    stages: [
      { key: "f1", label: "F1 in jar", typicalDays: [7, 14] },
      { key: "f2", label: "F2 in bottles", typicalDays: [2, 5] },
    ],
  },
  {
    id: "water_kefir",
    name: "Water kefir",
    stages: [
      { key: "f1", label: "F1 with grains", typicalDays: [1, 3] },
      { key: "f2", label: "F2 in bottles", typicalDays: [1, 3] },
    ],
  },
  {
    id: "custom",
    name: "Custom ferment",
    stages: [{ key: "ferment", label: "Fermenting", typicalDays: [5, 30] }],
  },
];

export const measurementDefinitions: MeasurementDefinition[] = [
  { id: "md-ph", key: "ph", label: "pH", unit: "pH", decimals: 1, min: 2, max: 7, isSystem: true },
  { id: "md-temp", key: "temp", label: "Temp", unit: "°C", decimals: 1, min: 0, max: 45, isSystem: true },
  { id: "md-brix", key: "brix", label: "Brix", unit: "°Bx", decimals: 1, min: 0, max: 30, isSystem: true },
  { id: "md-sg", key: "sg", label: "Gravity", unit: "SG", decimals: 3, min: 0.99, max: 1.1, isSystem: true },
  { id: "md-fizz", key: "fizz_height", label: "Foam height", unit: "cm", decimals: 0, min: 0, max: 30, isSystem: false },
];

const ph = (value: number, method = "strip"): Measurement => ({ definitionKey: "ph", value, unit: "pH", method });
const temp = (value: number): Measurement => ({ definitionKey: "temp", value, unit: "°C", method: null });
const brix = (value: number): Measurement => ({ definitionKey: "brix", value, unit: "°Bx", method: "refractometer" });

const rating = (r: Partial<Rating> & Pick<Rating, "overall">): Rating => ({
  fizz: null,
  sweetTart: null,
  flavor: null,
  offNotes: [],
  wouldRepeat: null,
  note: null,
  ...r,
});

const ing = (id: string, name: string, role: Ingredient["role"], amount: number, unit: string): Ingredient => ({
  id,
  name,
  role,
  amount,
  unit,
});

const add = (name: string, form: Addition["form"], amount: number | null, unit: string | null): Addition => ({
  name,
  form,
  amount,
  unit,
});

/* ---------------- Ingredient sets ---------------- */

const blackTeaBaseV1 = [
  ing("i1", "Filtered water", "water", 3.8, "L"),
  ing("i2", "Assam black tea", "tea", 12, "g"),
  ing("i3", "Cane sugar", "sugar", 200, "g"),
  ing("i4", "Starter tea", "starter", 380, "ml"),
];
const blackTeaBaseV2 = [
  ing("i1", "Filtered water", "water", 3.8, "L"),
  ing("i2", "Assam black tea", "tea", 12, "g"),
  ing("i3", "Cane sugar", "sugar", 228, "g"),
  ing("i4", "Starter tea", "starter", 400, "ml"),
];
const gingerV1 = [
  ing("i1", "Filtered water", "water", 3.8, "L"),
  ing("i2", "Assam black tea", "tea", 12, "g"),
  ing("i3", "Cane sugar", "sugar", 200, "g"),
  ing("i4", "Starter tea", "starter", 380, "ml"),
];
const gingerV2 = [
  ing("i1", "Filtered water", "water", 3.8, "L"),
  ing("i2", "Assam black tea", "tea", 8, "g"),
  ing("i5", "Sencha green tea", "tea", 4, "g"),
  ing("i3", "Cane sugar", "sugar", 200, "g"),
  ing("i4", "Starter tea", "starter", 380, "ml"),
];
const gingerV3 = [
  ing("i1", "Filtered water", "water", 3.8, "L"),
  ing("i2", "Assam black tea", "tea", 8, "g"),
  ing("i5", "Sencha green tea", "tea", 4, "g"),
  ing("i3", "Cane sugar", "sugar", 228, "g"),
  ing("i4", "Starter tea", "starter", 400, "ml"),
];
const lemonFig = [
  ing("i1", "Filtered water", "water", 1, "L"),
  ing("i6", "Water kefir grains", "starter", 60, "g"),
  ing("i3", "Raw cane sugar", "sugar", 60, "g"),
  ing("i7", "Dried fig", "flavor", 1, "whole"),
  ing("i8", "Lemon slice", "flavor", 2, "slices"),
];
const hibiscus = [
  ing("i1", "Filtered water", "water", 2, "L"),
  ing("i9", "Oolong tea", "tea", 6, "g"),
  ing("i10", "Dried hibiscus", "tea", 4, "g"),
  ing("i11", "Rosehip", "tea", 3, "g"),
  ing("i3", "Cane sugar", "sugar", 120, "g"),
  ing("i4", "Starter tea", "starter", 220, "ml"),
];

/* ---------------- Recipes & immutable versions ---------------- */

export const recipeVersions: RecipeVersion[] = [
  {
    id: "rv-ginger-1", recipeId: "r-ginger", versionNo: 1, parentVersionId: null,
    changeNote: "Saved from KB-009", sourceBatchId: "b-kb009",
    ingredients: gingerV1, params: { targetF1Days: 10, roomTempC: 23 },
    defaultBottles: [{ flavorName: "Ginger", additions: [add("Fresh ginger", "juice", 30, "ml")], primingSugarG: 4 }],
    createdAt: at("2026-09-15", "19:20"), batchCount: 1, avgOverall: 4,
  },
  {
    id: "rv-ginger-2", recipeId: "r-ginger", versionNo: 2, parentVersionId: "rv-ginger-1",
    changeNote: "Swap a third of the black tea for green tea", sourceBatchId: "b-kb011",
    ingredients: gingerV2, params: { targetF1Days: 10, roomTempC: 23 },
    defaultBottles: [{ flavorName: "Ginger", additions: [add("Fresh ginger", "juice", 30, "ml")], primingSugarG: 4 }],
    createdAt: at("2026-10-02", "18:05"), batchCount: 1, avgOverall: 3,
  },
  {
    id: "rv-ginger-3", recipeId: "r-ginger", versionNo: 3, parentVersionId: "rv-ginger-2",
    changeNote: "60 g/L sugar and 10.5% starter for more fizz", sourceBatchId: "b-kb012",
    ingredients: gingerV3, params: { targetF1Days: 11, roomTempC: 23 },
    defaultBottles: [{ flavorName: "Ginger", additions: [add("Fresh ginger", "juice", 30, "ml")], primingSugarG: 4 }],
    createdAt: at("2026-10-20", "20:40"), batchCount: 2, avgOverall: 4,
  },
  {
    id: "rv-ginger-4", recipeId: "r-ginger", versionNo: 4, parentVersionId: "rv-ginger-3",
    changeNote: "Longer F1 for a drier finish", sourceBatchId: null,
    ingredients: gingerV3, params: { targetF1Days: 13, roomTempC: 23 },
    defaultBottles: [{ flavorName: "Ginger", additions: [add("Fresh ginger", "juice", 30, "ml")], primingSugarG: 4 }],
    createdAt: at("2026-11-03", "21:10"), batchCount: 0, avgOverall: null,
  },
  {
    id: "rv-base-1", recipeId: "r-base", versionNo: 1, parentVersionId: null,
    changeNote: "Saved from KB-010", sourceBatchId: "b-kb010",
    ingredients: blackTeaBaseV1, params: { targetF1Days: 9, roomTempC: 22 },
    defaultBottles: [], createdAt: at("2026-10-08", "17:00"), batchCount: 1, avgOverall: 4,
  },
  {
    id: "rv-base-2", recipeId: "r-base", versionNo: 2, parentVersionId: "rv-base-1",
    changeNote: "More sugar and starter to match Ginger fizz v3", sourceBatchId: null,
    ingredients: blackTeaBaseV2, params: { targetF1Days: 10, roomTempC: 23 },
    defaultBottles: [], createdAt: at("2026-10-27", "20:00"), batchCount: 1, avgOverall: null,
  },
  {
    id: "rv-lemonfig-1", recipeId: "r-lemonfig", versionNo: 1, parentVersionId: null,
    changeNote: "Saved from WK-030", sourceBatchId: "b-wk030",
    ingredients: lemonFig, params: { targetF1Days: 2, roomTempC: 24 },
    defaultBottles: [{ flavorName: "Lemon", additions: [add("Lemon", "juice", 15, "ml")], primingSugarG: null }],
    createdAt: at("2026-10-25", "09:30"), batchCount: 2, avgOverall: 2,
  },
  {
    id: "rv-hibiscus-1", recipeId: "r-hibiscus", versionNo: 1, parentVersionId: null,
    changeNote: null, sourceBatchId: null,
    ingredients: hibiscus, params: { targetF1Days: 8, roomTempC: 24 },
    defaultBottles: [], createdAt: at("2026-11-02", "16:45"), batchCount: 1, avgOverall: null,
  },
];

const latest = (recipeId: string) =>
  recipeVersions.filter((v) => v.recipeId === recipeId).sort((a, b) => b.versionNo - a.versionNo)[0];

export const recipes: Recipe[] = [
  { id: "r-ginger", name: "Ginger fizz", fermentationTypeId: "kombucha", latestVersion: latest("r-ginger"), versionCount: 4, batchCount: 4, avgOverall: 3.7, archivedAt: null, createdAt: at("2026-09-15") },
  { id: "r-base", name: "Black tea base", fermentationTypeId: "kombucha", latestVersion: latest("r-base"), versionCount: 2, batchCount: 2, avgOverall: 4, archivedAt: null, createdAt: at("2026-10-08") },
  { id: "r-lemonfig", name: "Lemon & fig water kefir", fermentationTypeId: "water_kefir", latestVersion: latest("r-lemonfig"), versionCount: 1, batchCount: 2, avgOverall: 2, archivedAt: null, createdAt: at("2026-10-25") },
  { id: "r-hibiscus", name: "Hibiscus–rosehip oolong with a splash of lime, second attempt", fermentationTypeId: "kombucha", latestVersion: latest("r-hibiscus"), versionCount: 1, batchCount: 1, avgOverall: null, archivedAt: null, createdAt: at("2026-11-02") },
];

const ref = (versionId: string) => {
  const v = recipeVersions.find((x) => x.id === versionId)!;
  const r = recipes.find((x) => x.id === v.recipeId)!;
  return { recipeId: r.id, recipeName: r.name, versionId: v.id, versionNo: v.versionNo };
};

/* ---------------- Logs ---------------- */

export const logs: LogEntry[] = [
  // KB-014 (F1, day 8)
  { id: "l1", batchId: "b-kb014", bottleId: null, kind: "stage_change", occurredAt: at("2026-10-28", "19:10"), note: "Started from Black tea base v2", measurements: [ph(4.4, "meter"), temp(23.5)], createdAt: at("2026-10-28", "19:10") },
  { id: "l2", batchId: "b-kb014", bottleId: null, kind: "measure", occurredAt: at("2026-10-31", "08:05"), note: null, measurements: [ph(3.6, "meter"), temp(23)], createdAt: at("2026-10-31", "08:05") },
  { id: "l3", batchId: "b-kb014", bottleId: null, kind: "note", occurredAt: at("2026-11-02", "21:30"), note: "New SCOBY layer is covering the whole surface now.", measurements: [], createdAt: at("2026-11-02", "21:30") },
  { id: "l4", batchId: "b-kb014", bottleId: null, kind: "taste", occurredAt: at("2026-11-04", "07:50"), note: "Still sweet, faint vinegar at the back. Two more days?", measurements: [ph(3.1, "meter"), temp(22.5)], createdAt: at("2026-11-04", "07:50") },

  // KB-013 (F2, bottled 3 Nov)
  { id: "l10", batchId: "b-kb013", bottleId: null, kind: "stage_change", occurredAt: at("2026-10-18", "18:00"), note: "Brewed again from KB-012", measurements: [ph(4.3, "meter")], createdAt: at("2026-10-18", "18:00") },
  { id: "l11", batchId: "b-kb013", bottleId: null, kind: "taste", occurredAt: at("2026-10-29", "08:10"), note: "Tart enough, still a little sweet. Good for ginger.", measurements: [ph(3.0, "meter"), brix(5.8)], createdAt: at("2026-10-29", "08:10") },
  { id: "l12", batchId: "b-kb013", bottleId: null, kind: "stage_change", occurredAt: at("2026-11-03", "19:30"), note: "Bottled into 4 × 500 ml swing-tops", measurements: [ph(2.9, "meter"), temp(22)], createdAt: at("2026-11-03", "19:30") },
  { id: "l13", batchId: "b-kb013", bottleId: "bt-13a", kind: "burp", occurredAt: at("2026-11-04", "19:00"), note: "Gentle hiss", measurements: [], createdAt: at("2026-11-04", "19:00") },
  { id: "l14", batchId: "b-kb013", bottleId: "bt-13c", kind: "burp", occurredAt: at("2026-11-04", "19:01"), note: "Strong hiss, foam reached the neck", measurements: [], createdAt: at("2026-11-04", "19:01") },
  { id: "l15", batchId: "b-kb013", bottleId: "bt-13d", kind: "stage_change", occurredAt: at("2026-11-05", "07:40"), note: "Moved to fridge, raspberry was getting very lively", measurements: [], createdAt: at("2026-11-05", "07:40") },
  { id: "l16", batchId: "b-kb013", bottleId: "bt-13a", kind: "burp", occurredAt: at("2026-11-05", "07:42"), note: null, measurements: [], createdAt: at("2026-11-05", "07:42") },

  // WK-031 (water kefir F1)
  { id: "l20", batchId: "b-wk031", bottleId: null, kind: "stage_change", occurredAt: at("2026-11-04", "07:00"), note: "Grains look plump after the rest week", measurements: [temp(24)], createdAt: at("2026-11-04", "07:00") },

  // KB-012 (finished reference)
  { id: "l30", batchId: "b-kb012", bottleId: null, kind: "stage_change", occurredAt: at("2026-10-05", "18:00"), note: "Testing more sugar and starter", measurements: [ph(4.3, "meter")], createdAt: at("2026-10-05", "18:00") },
  { id: "l31", batchId: "b-kb012", bottleId: null, kind: "stage_change", occurredAt: at("2026-10-16", "19:00"), note: "Bottled 3 × 500 ml", measurements: [ph(2.9, "meter"), brix(5.4)], createdAt: at("2026-10-16", "19:00") },
  { id: "l32", batchId: "b-kb012", bottleId: null, kind: "taste", occurredAt: at("2026-10-19", "20:00"), note: "Best fizz so far. Sharp ginger, dry finish.", measurements: [], createdAt: at("2026-10-19", "20:00") },
];

const lastLogFor = (batchId: string) =>
  logs.filter((l) => l.batchId === batchId).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0] ?? null;

/* ---------------- Reminders ---------------- */

export const reminders: Reminder[] = [
  { id: "rm1", batchId: "b-kb014", bottleId: null, kind: "taste_check", dueAt: at("2026-11-05", "08:00"), status: "pending", label: "Taste KB-014" },
  { id: "rm2", batchId: "b-kb013", bottleId: "bt-13b", kind: "burp", dueAt: at("2026-11-05", "08:00"), status: "pending", label: "Burp bottle B" },
  { id: "rm3", batchId: "b-kb013", bottleId: "bt-13c", kind: "burp", dueAt: at("2026-11-05", "08:00"), status: "pending", label: "Burp bottle C" },
  { id: "rm4", batchId: "b-wk031", bottleId: null, kind: "bottle", dueAt: at("2026-11-06", "07:00"), status: "pending", label: "Strain grains and bottle WK-031" },
  { id: "rm5", batchId: "b-cu001", bottleId: null, kind: "taste_check", dueAt: at("2026-11-07", "18:00"), status: "pending", label: "Taste the hot sauce mash" },
];

const nextReminderFor = (batchId: string) =>
  reminders.filter((r) => r.batchId === batchId && r.status === "pending").sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0] ?? null;

/* ---------------- Bottles ---------------- */

const kb013Bottles: Bottle[] = [
  { id: "bt-13a", batchId: "b-kb013", label: "A", flavorName: "Ginger", volumeMl: 500, additions: [add("Fresh ginger", "juice", 30, "ml")], primingSugarG: 4, headspaceCm: 3, status: "conditioning", startedAt: at("2026-11-03", "19:30"), finishedAt: null, lastMeasurements: [], rating: null },
  { id: "bt-13b", batchId: "b-kb013", label: "B", flavorName: "Ginger", volumeMl: 500, additions: [add("Fresh ginger", "puree", 30, "g")], primingSugarG: 4, headspaceCm: 3, status: "conditioning", startedAt: at("2026-11-03", "19:30"), finishedAt: null, lastMeasurements: [], rating: null },
  { id: "bt-13c", batchId: "b-kb013", label: "C", flavorName: "Ginger", volumeMl: 500, additions: [add("Fresh ginger", "chunks", 15, "g")], primingSugarG: 8, headspaceCm: 3, status: "conditioning", startedAt: at("2026-11-03", "19:30"), finishedAt: null, lastMeasurements: [], rating: null },
  { id: "bt-13d", batchId: "b-kb013", label: "D", flavorName: "Raspberry–lime", volumeMl: 500, additions: [add("Raspberry", "puree", 40, "g"), add("Lime", "juice", 10, "ml")], primingSugarG: 4, headspaceCm: 3, status: "chilled", startedAt: at("2026-11-03", "19:30"), finishedAt: null, lastMeasurements: [], rating: null },
];

const kb012Bottles: Bottle[] = [
  { id: "bt-12a", batchId: "b-kb012", label: "A", flavorName: "Ginger", volumeMl: 500, additions: [add("Fresh ginger", "juice", 30, "ml")], primingSugarG: 4, headspaceCm: 3, status: "finished", startedAt: at("2026-10-16", "19:00"), finishedAt: at("2026-10-19", "20:00"), lastMeasurements: [ph(2.9)], rating: rating({ overall: 5, fizz: 5, sweetTart: 4, flavor: 5, wouldRepeat: true, note: "This is the one." }) },
  { id: "bt-12b", batchId: "b-kb012", label: "B", flavorName: "Ginger–turmeric", volumeMl: 500, additions: [add("Fresh ginger", "juice", 20, "ml"), add("Turmeric", "chunks", 5, "g")], primingSugarG: 4, headspaceCm: 3, status: "finished", startedAt: at("2026-10-16", "19:00"), finishedAt: at("2026-10-19", "20:00"), lastMeasurements: [ph(3.0)], rating: rating({ overall: 3, fizz: 3, sweetTart: 3, flavor: 3, offNotes: ["earthy"], wouldRepeat: false }) },
  { id: "bt-12c", batchId: "b-kb012", label: "C", flavorName: "Plain", volumeMl: 500, additions: [], primingSugarG: 4, headspaceCm: 3, status: "finished", startedAt: at("2026-10-16", "19:00"), finishedAt: at("2026-10-19", "20:00"), lastMeasurements: [ph(2.9)], rating: rating({ overall: 3, fizz: 2, sweetTart: 4, flavor: 3, wouldRepeat: null }) },
];

/* ---------------- Batches ---------------- */

type BatchSeed = Omit<Batch, "lastLog" | "nextReminder">;

const seeds: BatchSeed[] = [
  {
    id: "b-kb014", code: "KB-014", name: "Black tea base", fermentationTypeId: "kombucha", status: "active", stage: "f1",
    archivedAt: null, startedAt: at("2026-10-28", "19:10"), finishedAt: null, volumeMl: 4200, vessel: "1 gal glass jar",
    recipeVersion: ref("rv-base-2"), ingredients: blackTeaBaseV2, params: { targetF1Days: 10, roomTempC: 23, starterSource: "KB-012" },
    parentBatchId: "b-kb010", hypothesis: "More sugar and starter should give KB-010's flavour with more fizz.", isReference: false, rating: null, bottles: [],
  },
  {
    id: "b-kb013", code: "KB-013", name: "Ginger fizz", fermentationTypeId: "kombucha", status: "active", stage: "f2",
    archivedAt: null, startedAt: at("2026-10-18", "18:00"), finishedAt: null, volumeMl: 4200, vessel: "1 gal glass jar",
    recipeVersion: ref("rv-ginger-3"), ingredients: gingerV3, params: { targetF1Days: 11, roomTempC: 22 },
    parentBatchId: "b-kb012", hypothesis: "Does the form of the ginger change fizz more than extra priming sugar does?", isReference: false, rating: null, bottles: kb013Bottles,
  },
  {
    id: "b-wk031", code: "WK-031", name: "Lemon & fig water kefir", fermentationTypeId: "water_kefir", status: "active", stage: "f1",
    archivedAt: null, startedAt: at("2026-11-04", "07:00"), finishedAt: null, volumeMl: 1000, vessel: "1 L mason jar",
    recipeVersion: ref("rv-lemonfig-1"), ingredients: lemonFig, params: { targetF1Days: 2, roomTempC: 24 },
    parentBatchId: "b-wk030", hypothesis: "Raw cane sugar instead of white to fix last batch's yeasty taste.", isReference: false, rating: null, bottles: [],
  },
  {
    id: "b-kb015", code: "KB-015", name: "Hibiscus–rosehip oolong with a splash of lime, second attempt", fermentationTypeId: "kombucha", status: "active", stage: "f1",
    archivedAt: null, startedAt: at("2026-11-03", "16:45"), finishedAt: null, volumeMl: 2200, vessel: null,
    recipeVersion: ref("rv-hibiscus-1"), ingredients: hibiscus, params: { targetF1Days: 8 },
    parentBatchId: null, hypothesis: null, isReference: false, rating: null, bottles: [],
  },
  {
    id: "b-cu001", code: "CU-001", name: "Fresno & garlic hot sauce mash", fermentationTypeId: "custom", status: "active", stage: "f1",
    archivedAt: null, startedAt: at("2026-10-24", "12:00"), finishedAt: null, volumeMl: 750, vessel: "Fido jar with airlock",
    recipeVersion: null, ingredients: [ing("i20", "Fresno chillies", "flavor", 400, "g"), ing("i21", "Garlic", "flavor", 30, "g"), ing("i22", "Sea salt", "other", 3, "%")], params: {},
    parentBatchId: null, hypothesis: null, isReference: false, rating: null, bottles: [],
  },
  {
    id: "b-kb012", code: "KB-012", name: "Ginger fizz", fermentationTypeId: "kombucha", status: "finished", stage: "done",
    archivedAt: null, startedAt: at("2026-10-05", "18:00"), finishedAt: at("2026-10-19", "20:00"), volumeMl: 4200, vessel: "1 gal glass jar",
    recipeVersion: ref("rv-ginger-3"), ingredients: gingerV3, params: { targetF1Days: 11, roomTempC: 23 },
    parentBatchId: "b-kb011", hypothesis: "60 g/L sugar and more starter for more fizz.", isReference: true,
    rating: rating({ overall: 4, fizz: 5, sweetTart: 4, flavor: 4, wouldRepeat: true, note: "Bottle A was perfect. Turmeric didn't work." }), bottles: kb012Bottles,
  },
  {
    id: "b-kb011", code: "KB-011", name: "Ginger fizz", fermentationTypeId: "kombucha", status: "finished", stage: "done",
    archivedAt: null, startedAt: at("2026-09-21", "18:00"), finishedAt: at("2026-10-04", "19:00"), volumeMl: 4000, vessel: "1 gal glass jar",
    recipeVersion: ref("rv-ginger-2"), ingredients: gingerV2, params: { targetF1Days: 10, roomTempC: 24 },
    parentBatchId: "b-kb009", hypothesis: "Green tea for a lighter body.", isReference: false,
    rating: rating({ overall: 3, fizz: 2, sweetTart: 3, flavor: 4, offNotes: ["flat"], wouldRepeat: false, note: "Lighter, but barely fizzy." }), bottles: [],
  },
  {
    id: "b-kb010", code: "KB-010", name: "Black tea base", fermentationTypeId: "kombucha", status: "finished", stage: "done",
    archivedAt: null, startedAt: at("2026-09-24", "18:30"), finishedAt: at("2026-10-07", "18:00"), volumeMl: 4000, vessel: "1 gal glass jar",
    recipeVersion: ref("rv-base-1"), ingredients: blackTeaBaseV1, params: { targetF1Days: 9, roomTempC: 22 },
    parentBatchId: null, hypothesis: null, isReference: false,
    rating: rating({ overall: 4, fizz: 3, sweetTart: 3, flavor: 4, wouldRepeat: true }), bottles: [],
  },
  {
    id: "b-wk030", code: "WK-030", name: "Lemon & fig water kefir", fermentationTypeId: "water_kefir", status: "finished", stage: "done",
    archivedAt: null, startedAt: at("2026-10-22", "07:30"), finishedAt: at("2026-10-25", "09:00"), volumeMl: 1000, vessel: "1 L mason jar",
    recipeVersion: ref("rv-lemonfig-1"), ingredients: lemonFig.map((i) => (i.role === "sugar" ? { ...i, name: "White sugar" } : i)), params: { targetF1Days: 2, roomTempC: 26 },
    parentBatchId: null, hypothesis: null, isReference: false,
    rating: rating({ overall: 2, fizz: 3, sweetTart: 2, flavor: 2, offNotes: ["yeasty"], wouldRepeat: false, note: "Bready smell. Too warm in the kitchen?" }), bottles: [],
  },
  {
    id: "b-kb009", code: "KB-009", name: "Ginger fizz", fermentationTypeId: "kombucha", status: "finished", stage: "done",
    archivedAt: null, startedAt: at("2026-09-01", "18:00"), finishedAt: at("2026-09-14", "19:00"), volumeMl: 4000, vessel: "1 gal glass jar",
    recipeVersion: ref("rv-ginger-1"), ingredients: gingerV1, params: { targetF1Days: 10, roomTempC: 23 },
    parentBatchId: null, hypothesis: null, isReference: false,
    rating: rating({ overall: 4, fizz: 4, sweetTart: 3, flavor: 4, wouldRepeat: true }), bottles: [],
  },
  {
    id: "b-kb008", code: "KB-008", name: "Jasmine green", fermentationTypeId: "kombucha", status: "discarded", stage: "done",
    archivedAt: at("2026-09-02"), startedAt: at("2026-08-20", "18:00"), finishedAt: at("2026-08-29", "10:00"), volumeMl: 2000, vessel: null,
    recipeVersion: null, ingredients: [ing("i30", "Jasmine green tea", "tea", 8, "g"), ing("i3", "Cane sugar", "sugar", 100, "g")], params: {},
    parentBatchId: null, hypothesis: null, isReference: false, rating: null, bottles: [],
  },
];

export const batches: Batch[] = seeds.map((b) => ({
  ...b,
  lastLog: lastLogFor(b.id),
  nextReminder: nextReminderFor(b.id),
}));

export const profile = {
  displayName: "Sam",
  unitSystem: "metric" as const,
  tempUnit: "C" as const,
  timezone: "Europe/London",
  plan: "free" as const,
};

/** Blank-batch starting points per type. Gap in the contract; see FRONTEND_ARCHITECTURE.md. */
export const batchTemplates = {
  kombucha: {
    volumeMl: 4200,
    ingredients: [
      ing("t1", "Filtered water", "water", 3.8, "L"),
      ing("t2", "Black tea", "tea", 12, "g"),
      ing("t3", "Cane sugar", "sugar", 200, "g"),
      ing("t4", "Starter tea", "starter", 400, "ml"),
    ],
    params: { targetF1Days: 10 },
  },
  water_kefir: {
    volumeMl: 1000,
    ingredients: [
      ing("t1", "Filtered water", "water", 1, "L"),
      ing("t5", "Water kefir grains", "starter", 60, "g"),
      ing("t3", "Cane sugar", "sugar", 60, "g"),
    ],
    params: { targetF1Days: 2 },
  },
  custom: { volumeMl: 1000, ingredients: [], params: {} },
} as const;
