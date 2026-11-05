import type { DiffRow } from "@/lib/api/types";

/**
 * Presentation-only helpers over server-computed DiffRows. They decide WHERE the marker goes,
 * never WHETHER things differ (that is DiffRow.differs, owned by jarlore-be).
 */

/** Baseline = first column (a reference batch or the batch you brewed from). */
export function changedVsFirst(row: DiffRow): Set<number> {
  if (!row.differs) return new Set();
  return new Set(row.values.flatMap((v, i) => (i > 0 && v !== row.values[0] ? [i] : [])));
}

/**
 * Baseline = the most common value among siblings (F2 bottles from one jar).
 * On a tie (juice / puree / chunks) the row is the variable itself, so every non-empty value is marked.
 */
export function changedVsSiblings(row: DiffRow): Set<number> {
  if (!row.differs) return new Set();
  const freq = new Map<string, number>();
  row.values.forEach((v) => freq.set(String(v), (freq.get(String(v)) ?? 0) + 1));
  const top = Math.max(...freq.values());
  const modes = [...freq.entries()].filter(([, n]) => n === top).map(([v]) => v);
  if (modes.length > 1) return new Set(row.values.flatMap((v, i) => (v === null ? [] : [i])));
  return new Set(row.values.flatMap((v, i) => (String(v) === modes[0] ? [] : [i])));
}

export const groupLabel: Record<DiffRow["group"], string> = {
  ingredients: "Ingredients",
  additions: "Flavour additions",
  params: "Conditions",
  process: "Process",
  measurements: "Measurements",
  result: "Result",
};
