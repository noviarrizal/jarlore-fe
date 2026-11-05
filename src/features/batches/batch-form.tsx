"use client";

import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { CompareItemRef, CreateBatchRequest, DiffRow, Ingredient } from "@/lib/api/types";
import { Button, IconButton } from "@/components/ui/button";
import { Changed } from "@/components/ui/changed";
import { Field, Input, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { previewDiff, startBatch } from "./actions";

/**
 * One form for "Brew again" (with a base batch → live diff) and "New batch" (no base).
 * The diff comes from POST /v1/batches/diff-preview via a server action; nothing is diffed here.
 */
export function BatchForm({
  initial,
  base,
  versionNote,
}: {
  initial: CreateBatchRequest;
  base: { ref: CompareItemRef; title: string } | null;
  versionNote?: string;
}) {
  const toast = useToast();
  const [draft, setDraft] = useState<CreateBatchRequest>(initial);
  const [diff, setDiff] = useState<{ rows: DiffRow[]; changeCount: number } | null>(null);
  const [startedEarlier, setStartedEarlier] = useState(false);
  const [pending, startTransition] = useTransition();
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  // Live diff, debounced so typing "228" doesn't fire three requests.
  useEffect(() => {
    if (!base) return;
    const t = setTimeout(async () => {
      const res = await previewDiff(base.ref, draft);
      if (res.ok) setDiff(res.data);
    }, 250);
    return () => clearTimeout(t);
  }, [base, draft]);

  const changed = useMemo(() => new Set(diff?.rows.filter((r) => r.differs).map((r) => r.key)), [diff]);
  const changedRows = diff?.rows.filter((r) => r.differs) ?? [];

  function setIngredient(id: string, patch: Partial<Ingredient>) {
    setDraft((d) => ({ ...d, ingredients: d.ingredients.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));
  }

  function submit() {
    startTransition(async () => {
      const res = await startBatch(draft, idempotencyKey);
      // On success the action redirects; we only get here on failure.
      if (res && !res.ok) toast({ tone: "error", message: `Not started: ${res.message}`, action: { label: "Retry", onClick: submit } });
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex flex-col gap-6"
    >
      {base && (
        <section
          aria-live="polite"
          aria-label={`Changes compared with ${base.title}`}
          className="sticky top-0 z-20 -mx-4 border-b border-rule bg-sheet px-4 py-3 md:static md:mx-0 md:rounded-panel md:border"
        >
          <p className="text-label text-ink-2">Changes vs {base.title}</p>
          {changedRows.length === 0 ? (
            <p className="mt-1 text-body">Same as before so far. Change one thing, and write down why.</p>
          ) : (
            <ul className="mt-1 flex flex-col gap-0.5">
              {changedRows.map((r) => (
                <li key={r.key} className="text-body">
                  {r.label}{" "}
                  <span className="num">
                    {r.values[0] ?? "none"} → <Changed>{`${r.values[1] ?? "removed"}${r.unit && r.values[1] !== null ? ` ${r.unit}` : ""}`}</Changed>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {versionNote && <p className="mt-2 text-small text-ink-2">{versionNote}</p>}
        </section>
      )}

      <Field label="Name">
        {(p) => (
          <Input
            {...p}
            value={draft.name ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="Black tea base"
            required
          />
        )}
      </Field>

      <Field label="What are you changing, and why?" hint="This is what you'll read when you compare results.">
        {(p) => (
          <Textarea
            {...p}
            rows={2}
            value={draft.hypothesis ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, hypothesis: e.target.value }))}
            placeholder="More sugar for more fizz"
          />
        )}
      </Field>

      <fieldset>
        <legend className="text-section">Ingredients</legend>
        <ul className="mt-2 divide-y divide-rule border-y border-rule">
          {draft.ingredients.map((i) => {
            const isChanged = changed.has(`ingredient.${i.role}:${i.name}`);
            return (
              <li key={i.id} className="flex items-center gap-3 py-2">
                <label htmlFor={`ing-${i.id}`} className="min-w-0 flex-1 break-words">
                  <Changed when={isChanged}>{i.name}</Changed>
                </label>
                <div className="flex h-11 w-32 shrink-0 items-center rounded-control border border-rule bg-sheet focus-within:border-action">
                  <input
                    id={`ing-${i.id}`}
                    inputMode="decimal"
                    value={String(i.amount)}
                    onChange={(e) => {
                      const n = Number(e.target.value.replace(",", "."));
                      if (!Number.isNaN(n)) setIngredient(i.id, { amount: n });
                    }}
                    className="num h-full w-full min-w-0 bg-transparent px-3 text-right text-body-lg outline-none focus-visible:shadow-none"
                  />
                  <span className="pr-3 text-small text-ink-3">{i.unit}</span>
                </div>
                <IconButton
                  label={`Remove ${i.name}`}
                  onClick={() => setDraft((d) => ({ ...d, ingredients: d.ingredients.filter((x) => x.id !== i.id) }))}
                >
                  <Trash2 className="size-4" />
                </IconButton>
              </li>
            );
          })}
        </ul>
        <AddIngredient
          onAdd={(ing) => setDraft((d) => ({ ...d, ingredients: [...d.ingredients, ing] }))}
        />
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Batch size">
          {(p) => (
            <div className="flex h-11 items-center rounded-control border border-rule bg-sheet focus-within:border-action">
              <input
                {...p}
                inputMode="numeric"
                value={String(draft.volumeMl)}
                onChange={(e) => setDraft((d) => ({ ...d, volumeMl: Number(e.target.value) || 0 }))}
                className="num h-full w-full min-w-0 bg-transparent px-3 text-body-lg outline-none focus-visible:shadow-none"
              />
              <span className="pr-3 text-small text-ink-3">ml</span>
            </div>
          )}
        </Field>
        <Field label="Planned F1">
          {(p) => (
            <div className="flex h-11 items-center rounded-control border border-rule bg-sheet focus-within:border-action">
              <input
                {...p}
                inputMode="numeric"
                value={draft.params.targetF1Days ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, params: { ...d.params, targetF1Days: e.target.value ? Number(e.target.value) : undefined } }))
                }
                className="num h-full w-full min-w-0 bg-transparent px-3 text-body-lg outline-none focus-visible:shadow-none"
              />
              <span className="pr-3 text-small text-ink-3">days</span>
            </div>
          )}
        </Field>
      </div>

      <div>
        <label className="flex h-11 items-center gap-2 text-body">
          <input type="checkbox" className="size-5 accent-action" checked={startedEarlier} onChange={(e) => setStartedEarlier(e.target.checked)} />
          I started this earlier
        </label>
        {startedEarlier && (
          <Field label="Started on" className="mt-2 max-w-xs">
            {(p) => (
              <Input
                {...p}
                type="date"
                onChange={(e) => setDraft((d) => ({ ...d, startedAt: e.target.value ? `${e.target.value}T09:00:00Z` : undefined }))}
              />
            )}
          </Field>
        )}
      </div>

      <div className="sticky bottom-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom))] -mx-4 border-t border-rule bg-paper px-4 py-3 md:static md:mx-0 md:border-0 md:px-0">
        <Button type="submit" variant="primary" className="w-full md:w-auto" disabled={pending || draft.ingredients.length === 0 || !draft.name?.trim()}>
          {pending ? "Starting…" : "Start batch"}
        </Button>
      </div>
    </form>
  );
}

function AddIngredient({ onAdd }: { onAdd: (i: Ingredient) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState("g");

  if (!open) {
    return (
      <Button variant="quiet" className="mt-2 -ml-3" icon={<Plus className="size-4" aria-hidden />} onClick={() => setOpen(true)}>
        Add ingredient
      </Button>
    );
  }
  return (
    <div className="mt-3 grid grid-cols-[1fr_6rem_5rem] items-end gap-2">
      <Field label="Ingredient">{(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} autoFocus />}</Field>
      <Field label="Amount">{(p) => <Input {...p} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />}</Field>
      <Field label="Unit">{(p) => <Input {...p} value={unit} onChange={(e) => setUnit(e.target.value)} />}</Field>
      <div className="col-span-3 flex gap-2">
        <Button
          variant="secondary"
          disabled={!name.trim() || Number.isNaN(Number(amount)) || amount === ""}
          onClick={() => {
            onAdd({ id: `new-${Date.now()}`, name: name.trim(), role: "other", amount: Number(amount), unit });
            setName("");
            setAmount("");
            setOpen(false);
          }}
        >
          Add
        </Button>
        <Button variant="quiet" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
