/**
 * MOCK ONLY. Stand-in for the backend diff engine (POST /v1/compare, GET /v1/recipes/{id}/diff).
 * The backend owns diff rules. UI code must never import this file directly; it goes through `api`.
 */
import type { Batch, Bottle, CreateBatchRequest, DiffRow, DiffValue, Ingredient, RecipeVersion } from "@/lib/api/types";

const DAY = 86_400_000;
const days = (from: string, to: string | null) =>
  to ? Math.round((new Date(to).getTime() - new Date(from).getTime()) / DAY) : null;

function row(
  key: string,
  label: string,
  group: DiffRow["group"],
  values: DiffValue[],
  unit: string | null = null,
): DiffRow {
  const base = values[0];
  const differs = values.some((v) => v !== base);
  const direction = values.map((v, i) => {
    if (i === 0 || v === null || base === null) return null;
    if (typeof v === "number" && typeof base === "number") return v > base ? "up" : v < base ? "down" : "same";
    return v === base ? "same" : null;
  });
  return { key, label, group, values, unit, differs, direction };
}

function ingredientRows(sets: Ingredient[][]): DiffRow[] {
  const names = Array.from(new Set(sets.flatMap((s) => s.map((i) => `${i.role}:${i.name}`))));
  return names.map((n) => {
    const [, name] = n.split(":");
    const found = sets.map((s) => s.find((i) => `${i.role}:${i.name}` === n));
    const unit = found.find(Boolean)?.unit ?? null;
    return row(`ingredient.${n}`, name, "ingredients", found.map((i) => i?.amount ?? null), unit);
  });
}

export function diffBatches(items: Batch[]): DiffRow[] {
  const f1End = (b: Batch) => b.bottles[0]?.startedAt ?? b.finishedAt;
  return [
    row("recipe", "Recipe", "process", items.map((b) => (b.recipeVersion ? `${b.recipeVersion.recipeName} v${b.recipeVersion.versionNo}` : null))),
    ...ingredientRows(items.map((b) => b.ingredients)),
    row("params.roomTempC", "Room temperature", "params", items.map((b) => b.params.roomTempC ?? null), "°C"),
    row("process.f1Days", "F1 length", "process", items.map((b) => days(b.startedAt, f1End(b))), "days"),
    row("process.bottles", "Bottles", "process", items.map((b) => b.bottles.length || null)),
    row("result.overall", "Overall", "result", items.map((b) => b.rating?.overall ?? null), "/5"),
    row("result.fizz", "Fizz", "result", items.map((b) => b.rating?.fizz ?? null), "/5"),
    row("result.sweetTart", "Sweet ↔ tart", "result", items.map((b) => b.rating?.sweetTart ?? null), "/5"),
    row("result.wouldRepeat", "Brew again?", "result", items.map((b) => (b.rating?.wouldRepeat == null ? null : b.rating.wouldRepeat ? "Yes" : "No"))),
  ];
}

export function diffBottles(items: Bottle[]): DiffRow[] {
  const additionNames = Array.from(new Set(items.flatMap((b) => b.additions.map((a) => a.name))));
  return [
    row("flavorName", "Flavour", "additions", items.map((b) => b.flavorName)),
    ...additionNames.flatMap((name) => {
      const found = items.map((b) => b.additions.find((a) => a.name === name));
      return [
        row(`addition.${name}.form`, `${name} form`, "additions", found.map((a) => a?.form ?? null)),
        row(`addition.${name}.amount`, `${name} amount`, "additions", found.map((a) => a?.amount ?? null), found.find(Boolean)?.unit ?? null),
      ];
    }),
    row("primingSugarG", "Priming sugar", "additions", items.map((b) => b.primingSugarG), "g"),
    row("headspaceCm", "Headspace", "process", items.map((b) => b.headspaceCm), "cm"),
    row("volumeMl", "Bottle size", "process", items.map((b) => b.volumeMl), "ml"),
    row("result.overall", "Overall", "result", items.map((b) => b.rating?.overall ?? null), "/5"),
    row("result.fizz", "Fizz", "result", items.map((b) => b.rating?.fizz ?? null), "/5"),
  ];
}

export function diffVersions(items: RecipeVersion[]): DiffRow[] {
  return [
    ...ingredientRows(items.map((v) => v.ingredients)),
    row("params.targetF1Days", "Target F1 length", "params", items.map((v) => v.params.targetF1Days ?? null), "days"),
    row("params.roomTempC", "Room temperature", "params", items.map((v) => v.params.roomTempC ?? null), "°C"),
  ];
}

/** Brew-again live diff: base batch vs. the draft being edited. */
export function diffDraft(base: Batch, draft: CreateBatchRequest): DiffRow[] {
  return [
    ...ingredientRows([base.ingredients, draft.ingredients]),
    row("volumeMl", "Batch size", "process", [base.volumeMl, draft.volumeMl], "ml"),
    row("params.targetF1Days", "Target F1 length", "params", [base.params.targetF1Days ?? null, draft.params.targetF1Days ?? null], "days"),
    row("params.roomTempC", "Room temperature", "params", [base.params.roomTempC ?? null, draft.params.roomTempC ?? null], "°C"),
  ];
}
