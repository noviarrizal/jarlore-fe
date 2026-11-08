"use client";

import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import type { Addition, BottleInput, BottleSpec, DiffResult } from "@/lib/api/types";
import { Button, IconButton } from "@/components/ui/button";
import { Changed } from "@/components/ui/changed";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { bottleBatch, previewBottle } from "./actions";

export type BottleSource = { value: string; label: string; spec: BottleSpec };

type Row = {
  key: string;
  label: string;
  flavorName: string;
  volumeMl: string;
  additions: (Addition & { key: string })[];
  primingSugarG: string;
  headspaceCm: string;
  source: string; // "" | "recipe_version:<id>" | "bottle:<id>"
  hypothesis: string;
};

const forms: Addition["form"][] = ["juice", "puree", "chunks", "whole", "syrup", "dried", "other"];
const letter = (n: number) => String.fromCharCode(65 + (n % 26));
let seq = 0;
const k = () => `k${++seq}`;

function blank(label: string, prev?: Row): Row {
  return {
    key: k(),
    label,
    flavorName: "",
    volumeMl: prev?.volumeMl ?? "500",
    additions: [],
    primingSugarG: prev?.primingSugarG ?? "",
    headspaceCm: prev?.headspaceCm ?? "",
    source: "",
    hypothesis: "",
  };
}

const optionalNumber = (s: string) => (s.trim() === "" ? null : Number(s.replace(",", ".")));

function toInput(r: Row): BottleInput {
  const [type, id] = r.source.split(":");
  return {
    label: r.label.trim(),
    flavorName: r.flavorName.trim(),
    volumeMl: Number(r.volumeMl) || 0,
    additions: r.additions
      .filter((a) => a.name.trim())
      .map(({ key: _key, ...a }) => (void _key, { ...a, name: a.name.trim(), unit: a.amount === null ? null : a.unit })),
    primingSugarG: optionalNumber(r.primingSugarG),
    headspaceCm: optionalNumber(r.headspaceCm),
    ...(r.source ? { source: { type: type as "recipe_version" | "bottle", id }, hypothesis: r.hypothesis.trim() || null } : {}),
  };
}

/**
 * Bottle it: split an F1 jar into F2 bottles, each its own experiment. A bottle can
 * start from a bottle recipe or an earlier bottle; jarlore-be then shows what changed
 * and whether the change becomes a new recipe version.
 */
export function BottleForm({
  batch,
  sources,
}: {
  batch: { id: string; code: string; bottleCount: number };
  sources: { recipes: BottleSource[]; bottles: BottleSource[] };
}) {
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>(() => [blank(letter(batch.bottleCount))]);
  const [bottledEarlier, setBottledEarlier] = useState(false);
  const [bottledAt, setBottledAt] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const all = [...sources.recipes, ...sources.bottles];

  const update = (key: string, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  function pickSource(row: Row, value: string) {
    const s = all.find((x) => x.value === value);
    if (!s) return update(row.key, { source: "" });
    update(row.key, {
      source: value,
      flavorName: s.spec.flavorName,
      volumeMl: String(s.spec.volumeMl),
      additions: s.spec.additions.map((a) => ({ ...a, key: k() })),
      primingSugarG: s.spec.primingSugarG === null ? "" : String(s.spec.primingSugarG),
      headspaceCm: s.spec.headspaceCm === null ? "" : String(s.spec.headspaceCm),
    });
  }

  const valid = rows.length > 0 && rows.every((r) => r.label.trim() && r.flavorName.trim() && Number(r.volumeMl) > 0);

  function submit() {
    startTransition(async () => {
      const res = await bottleBatch(batch.id, { bottles: rows.map(toInput), ...(bottledAt ? { bottledAt } : {}) }, idempotencyKey);
      // On success the action redirects; we only get here on failure.
      if (res && !res.ok) toast({ tone: "error", message: `Not bottled: ${res.message}`, action: { label: "Retry", onClick: submit } });
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex flex-col gap-2"
    >
      <ol className="flex flex-col">
        {rows.map((r, i) => (
          <li key={r.key} className="border-t border-rule py-5">
            <div className="flex items-center gap-3">
              <h2 className="flex-1 text-section">
                Bottle <span className="code">{r.label || "?"}</span>
              </h2>
              {rows.length > 1 && (
                <IconButton label={`Remove bottle ${r.label}`} onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}>
                  <Trash2 className="size-4" />
                </IconButton>
              )}
            </div>

            {all.length > 0 && (
              <Field label="Start from" className="mt-3" hint={r.source ? undefined : "Optional: reuse a bottle recipe or repeat an earlier bottle."}>
                {(p) => (
                  <Select {...p} value={r.source} onChange={(e) => pickSource(r, e.target.value)}>
                    <option value="">Nothing, start blank</option>
                    {sources.recipes.length > 0 && (
                      <optgroup label="Bottle recipes">
                        {sources.recipes.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {sources.bottles.length > 0 && (
                      <optgroup label="Earlier bottles">
                        {sources.bottles.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </Select>
                )}
              </Field>
            )}

            <div className="mt-3 grid grid-cols-[5rem_1fr] gap-3">
              <Field label="Label">{(p) => <Input {...p} value={r.label} maxLength={8} onChange={(e) => update(r.key, { label: e.target.value.toUpperCase() })} />}</Field>
              <Field label="Flavour">{(p) => <Input {...p} value={r.flavorName} maxLength={80} onChange={(e) => update(r.key, { flavorName: e.target.value })} placeholder="Ginger juice" />}</Field>
            </div>

            <Additions row={r} onChange={(additions) => update(r.key, { additions })} />

            <div className="mt-3 grid grid-cols-3 gap-3">
              <Unit label="Bottle size" unit="ml" value={r.volumeMl} onChange={(v) => update(r.key, { volumeMl: v })} />
              <Unit label="Priming sugar" unit="g" value={r.primingSugarG} onChange={(v) => update(r.key, { primingSugarG: v })} />
              <Unit label="Headspace" unit="cm" value={r.headspaceCm} onChange={(v) => update(r.key, { headspaceCm: v })} />
            </div>

            {r.source && (
              <>
                <Field label="What are you changing, and why?" className="mt-3">
                  {(p) => <Textarea {...p} rows={2} value={r.hypothesis} onChange={(e) => update(r.key, { hypothesis: e.target.value })} placeholder="Puree instead of juice, for more body" />}
                </Field>
                <SourceDiff row={r} sourceLabel={all.find((s) => s.value === r.source)?.label ?? ""} />
              </>
            )}
            {i === rows.length - 1 && (
              <Button variant="quiet" className="mt-4 -ml-3" icon={<Plus className="size-4" aria-hidden />} onClick={() => setRows((rs) => [...rs, blank(letter(batch.bottleCount + rs.length), r)])}>
                Add bottle
              </Button>
            )}
          </li>
        ))}
      </ol>

      <div>
        <label className="flex h-11 items-center gap-2 text-body">
          <input type="checkbox" className="size-5 accent-action" checked={bottledEarlier} onChange={(e) => { setBottledEarlier(e.target.checked); if (!e.target.checked) setBottledAt(undefined); }} />
          I bottled these earlier
        </label>
        {bottledEarlier && (
          <Field label="Bottled on" className="mt-2 max-w-xs">
            {(p) => <Input {...p} type="date" onChange={(e) => setBottledAt(e.target.value ? `${e.target.value}T09:00:00Z` : undefined)} />}
          </Field>
        )}
      </div>

      <div className="sticky bottom-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom))] -mx-4 border-t border-rule bg-paper px-4 py-3 md:static md:mx-0 md:border-0 md:px-0">
        <Button type="submit" variant="primary" className="w-full md:w-auto" disabled={pending || !valid}>
          {pending ? "Bottling…" : `Bottle ${rows.length} from ${batch.code}`}
        </Button>
      </div>
    </form>
  );
}

function Unit({ label, unit, value, onChange }: { label: string; unit: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      {(p) => (
        <div className="flex h-11 items-center rounded-control border border-rule bg-sheet focus-within:border-action">
          <input {...p} inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} className="num h-full w-full min-w-0 bg-transparent px-3 text-body-lg outline-none focus-visible:shadow-none" />
          <span className="pr-3 text-small text-ink-3">{unit}</span>
        </div>
      )}
    </Field>
  );
}

function Additions({ row, onChange }: { row: Row; onChange: (a: Row["additions"]) => void }) {
  const set = (key: string, patch: Partial<Addition>) => onChange(row.additions.map((a) => (a.key === key ? { ...a, ...patch } : a)));
  return (
    <fieldset className="mt-3">
      <legend className="text-label text-ink">Additions</legend>
      {row.additions.length === 0 && <p className="mt-1 text-small text-ink-2">Nothing added yet.</p>}
      <ul className="mt-1 flex flex-col gap-2">
        {row.additions.map((a) => (
          <li key={a.key} className="grid grid-cols-[1fr_auto] gap-2 md:grid-cols-[1fr_8rem_6rem_5rem_auto]">
            <Input aria-label="Addition" value={a.name} onChange={(e) => set(a.key, { name: e.target.value })} placeholder="Ginger" className="md:col-span-1" />
            <IconButton label={`Remove ${a.name || "addition"}`} onClick={() => onChange(row.additions.filter((x) => x.key !== a.key))} className="md:order-last">
              <Trash2 className="size-4" />
            </IconButton>
            <div className="col-span-2 grid grid-cols-[1fr_5rem_4.5rem] gap-2 md:col-span-3 md:grid-cols-subgrid">
              <Select aria-label="Form" value={a.form} onChange={(e) => set(a.key, { form: e.target.value as Addition["form"] })}>
                {forms.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </Select>
              <Input aria-label="Amount" inputMode="decimal" className="num" value={a.amount ?? ""} onChange={(e) => set(a.key, { amount: optionalNumber(e.target.value) })} />
              <Input aria-label="Unit" value={a.unit ?? ""} onChange={(e) => set(a.key, { unit: e.target.value || null })} />
            </div>
          </li>
        ))}
      </ul>
      <Button variant="quiet" className="mt-1 -ml-3" icon={<Plus className="size-4" aria-hidden />} onClick={() => onChange([...row.additions, { key: k(), name: "", form: "juice", amount: null, unit: "ml" }])}>
        Add addition
      </Button>
    </fieldset>
  );
}

/** Live diff against the chosen source, computed by jarlore-be. */
function SourceDiff({ row, sourceLabel }: { row: Row; sourceLabel: string }) {
  const [diff, setDiff] = useState<DiffResult | null>(null);
  const input = toInput(row);
  const body = JSON.stringify(input);
  useEffect(() => {
    if (!input.source || !input.label || !input.flavorName || input.volumeMl < 1) return;
    const t = setTimeout(async () => {
      const res = await previewBottle(input.source!, input);
      setDiff(res.ok ? res.data : null);
    }, 250);
    return () => clearTimeout(t);
    // body captures every field of the input
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body]);

  const changed = diff?.rows.filter((r) => r.differs) ?? [];
  return (
    <section aria-live="polite" aria-label={`Changes compared with ${sourceLabel}`} className="mt-3 rounded-panel border border-rule bg-sheet px-4 py-3">
      <p className="text-label text-ink-2">Changes vs {sourceLabel}</p>
      {changed.length === 0 ? (
        <p className="mt-1 text-body">Same as the source so far.</p>
      ) : (
        <ul className="mt-1 flex flex-col gap-0.5">
          {changed.map((r) => (
            <li key={r.key} className="text-body">
              {r.label}{" "}
              <span className="num">
                {r.values[0] ?? "none"} → <Changed>{`${r.values[1] ?? "removed"}${r.unit && r.values[1] !== null ? ` ${r.unit}` : ""}`}</Changed>
              </span>
            </li>
          ))}
        </ul>
      )}
      {diff?.willCreateVersion && (
        <p className="mt-2 text-small text-ink-2">This bottle becomes v{diff.nextVersionNo} of the recipe. Earlier versions stay exactly as they were.</p>
      )}
    </section>
  );
}
