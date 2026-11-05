import { ArrowDown, ArrowUp } from "lucide-react";
import type { ReactNode } from "react";
import type { DiffRow, DiffValue } from "@/lib/api/types";
import { Changed } from "@/components/ui/changed";
import { cx } from "@/components/ui/cx";
import { changedVsFirst, changedVsSiblings, groupLabel } from "./marking";

export type DiffColumn = { key: string; title: ReactNode; subtitle?: ReactNode; isBaseline?: boolean };

/**
 * "What changed, and how did the result differ?" as a table. The attribute column sticks while
 * extra columns scroll sideways on phones. Changed values carry the marker; numbers that moved
 * vs the baseline get a direction arrow. Rows are grouped so results sit apart from inputs.
 */
export function DiffTable({
  columns,
  rows,
  onlyDifferences,
  baseline = "first",
  caption,
}: {
  columns: DiffColumn[];
  rows: DiffRow[];
  onlyDifferences: boolean;
  baseline?: "first" | "siblings";
  caption: string;
}) {
  const visible = rows.filter((r) => (onlyDifferences ? r.differs : r.values.some((v) => v !== null)));
  const groups = (Object.keys(groupLabel) as DiffRow["group"][])
    .map((g) => ({ group: g, rows: visible.filter((r) => r.group === g) }))
    .filter((g) => g.rows.length > 0);

  if (visible.length === 0) {
    return <p className="text-body text-ink-2">No differences. These were made the same way.</p>;
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <table className="w-full min-w-max border-collapse text-left md:min-w-0">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-rule-strong">
            <th scope="col" className="sticky left-0 z-10 bg-paper py-2 pr-4 align-bottom text-label text-ink-2">
              <span className="sr-only">Attribute</span>
            </th>
            {columns.map((c) => (
              <th key={c.key} scope="col" className="min-w-28 px-3 py-2 align-bottom">
                <span className="block font-semibold text-ink">{c.title}</span>
                {c.subtitle && <span className="block max-w-48 text-small font-normal break-words text-ink-2">{c.subtitle}</span>}
                {c.isBaseline && <span className="mt-1 inline-block text-small font-semibold text-tea-ink">Baseline</span>}
              </th>
            ))}
          </tr>
        </thead>
        {groups.map(({ group, rows: groupRows }) => (
          <tbody key={group}>
            <tr>
              <th colSpan={columns.length + 1} scope="colgroup" className="sticky left-0 bg-paper pt-5 pb-1 text-label text-ink-2">
                {groupLabel[group]}
              </th>
            </tr>
            {groupRows.map((r) => {
              const marked = baseline === "first" ? changedVsFirst(r) : changedVsSiblings(r);
              return (
                <tr key={r.key} className="border-b border-rule">
                  <th scope="row" className="sticky left-0 z-10 max-w-40 bg-paper py-2.5 pr-4 align-top text-body font-normal text-ink-2">
                    {r.label}
                  </th>
                  {r.values.map((v, i) => (
                    <td key={i} className={cx("px-3 py-2.5 align-top", r.group === "result" && "font-semibold")}>
                      <Cell value={v} unit={r.unit} changed={marked.has(i)} direction={baseline === "first" ? r.direction[i] : null} />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        ))}
      </table>
    </div>
  );
}

function Cell({ value, unit, changed, direction }: { value: DiffValue; unit: string | null; changed: boolean; direction: DiffRow["direction"][number] }) {
  if (value === null) return <span className="text-ink-3">—</span>;
  const isNum = typeof value === "number";
  const text = isNum ? `${Number.isInteger(value) ? value : value.toFixed(1)}${unit ? (unit.startsWith("/") ? unit : ` ${unit}`) : ""}` : value;
  return (
    <span className={cx("inline-flex items-center gap-1", isNum && "num")}>
      <Changed when={changed}>{text}</Changed>
      {direction === "up" && <ArrowUp className="size-3.5 text-ink-2" aria-label="higher" />}
      {direction === "down" && <ArrowDown className="size-3.5 text-ink-2" aria-label="lower" />}
    </span>
  );
}
