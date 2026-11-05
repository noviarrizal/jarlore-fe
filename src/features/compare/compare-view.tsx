"use client";

import Link from "next/link";
import { useState } from "react";
import type { CompareResult } from "@/lib/api/types";
import { DiffTable } from "./diff-table";

export function CompareView({ result }: { result: CompareResult }) {
  const [onlyDifferences, setOnlyDifferences] = useState(true);
  const changes = result.rows.filter((r) => r.differs && r.group !== "result").length;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <p className="text-body">
          <span className="num font-semibold">{changes}</span> {changes === 1 ? "thing" : "things"} changed going in.
        </p>
        <label className="flex h-11 cursor-pointer items-center gap-2 text-body">
          <input
            type="checkbox"
            checked={onlyDifferences}
            onChange={(e) => setOnlyDifferences(e.target.checked)}
            className="size-5 accent-action"
          />
          Only differences
        </label>
      </div>
      <DiffTable
        caption="Comparison"
        onlyDifferences={onlyDifferences}
        columns={result.items.map((it, i) => ({
          key: it.ref.id,
          title:
            it.ref.type === "batch" ? (
              <Link href={`/batches/${it.ref.id}`} className="code hover:underline">
                {it.title}
              </Link>
            ) : (
              <span className="code">{it.title}</span>
            ),
          subtitle: it.subtitle,
          isBaseline: i === 0,
        }))}
        rows={result.rows}
      />
    </div>
  );
}
