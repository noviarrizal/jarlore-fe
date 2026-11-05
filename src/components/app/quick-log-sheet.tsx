"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { logEntry } from "@/features/batches/actions";
import type { CreateLogRequest, LogKind, Measurement, MeasurementDefinition } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { PenLine } from "lucide-react";
import { cx } from "@/components/ui/cx";
import { Textarea } from "@/components/ui/field";
import { MeasurementInput } from "@/components/ui/measurement-input";
import { Segmented } from "@/components/ui/segmented";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";

export type QuickLogTarget = {
  id: string;
  code: string;
  name: string;
  bottles?: { id: string; label: string; flavorName: string }[];
};

// System measurement definitions. Will come from GET /v1/measurement-definitions.
const PH: MeasurementDefinition = { id: "md-ph", key: "ph", label: "pH", unit: "pH", decimals: 1, min: 2, max: 7, isSystem: true };
const TEMP: MeasurementDefinition = { id: "md-temp", key: "temp", label: "Temperature", unit: "°C", decimals: 1, min: 0, max: 45, isSystem: true };
const MORE: MeasurementDefinition[] = [
  { id: "md-brix", key: "brix", label: "Brix", unit: "°Bx", decimals: 1, min: 0, max: 30, isSystem: true },
  { id: "md-sg", key: "sg", label: "Gravity", unit: "SG", decimals: 3, min: 0.99, max: 1.1, isSystem: true },
  { id: "md-fizz", key: "fizz_height", label: "Foam height", unit: "cm", decimals: 0, min: 0, max: 30, isSystem: false },
];

const kinds: { value: LogKind; label: string; verb: string }[] = [
  { value: "taste", label: "Taste", verb: "Log taste" },
  { value: "burp", label: "Burp", verb: "Log burp" },
  { value: "measure", label: "Measure", verb: "Log measurement" },
  { value: "note", label: "Note", verb: "Log note" },
];

type OpenLog = (target: QuickLogTarget, kind?: LogKind) => void;
const QuickLogContext = createContext<OpenLog>(() => {});

/** One quick-log sheet for the whole app; any screen opens it with useQuickLog(). */
export function QuickLogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ target: QuickLogTarget; kind: LogKind; key: number } | null>(null);
  const open = useCallback<OpenLog>((target, kind = "taste") => setState({ target, kind, key: Date.now() }), []);
  return (
    <QuickLogContext.Provider value={open}>
      {children}
      <QuickLogSheet
        key={state?.key}
        target={state?.target ?? null}
        initialKind={state?.kind}
        open={state !== null}
        onClose={() => setState(null)}
      />
    </QuickLogContext.Provider>
  );
}

export const useQuickLog = () => useContext(QuickLogContext);

/** "Log" button used on rows and detail pages. */
export function LogButton({
  target,
  kind,
  label = "Log",
  variant = "secondary",
  compact = false,
  icon,
  className,
}: {
  target: QuickLogTarget;
  kind?: LogKind;
  label?: string;
  variant?: "primary" | "secondary";
  /** Icon-only below 768px, to give row text the width on phones. */
  compact?: boolean;
  icon?: React.ReactNode;
  className?: string;
}) {
  const open = useQuickLog();
  return (
    <Button
      variant={variant}
      className={cx(compact && "w-11 px-0 md:w-auto md:px-4", className)}
      icon={icon ?? <PenLine className="size-4.5" aria-hidden />}
      onClick={() => open(target, kind)}
      aria-label={label === "Log" ? `Log on ${target.code}` : undefined}
    >
      <span className={cx(compact && "sr-only md:not-sr-only")}>{label}</span>
    </Button>
  );
}

/**
 * The most-used surface in the product. Target: a common entry in 2–3 taps, one-handed.
 * Saves optimistically: the sheet closes immediately and a toast confirms or offers Retry.
 */
export function QuickLogSheet({
  target,
  open,
  onClose,
  initialKind = "taste",
}: {
  target: QuickLogTarget | null;
  open: boolean;
  onClose: () => void;
  initialKind?: LogKind;
}) {
  const router = useRouter();
  const toast = useToast();
  const [kind, setKind] = useState<LogKind>(initialKind);
  const [values, setValues] = useState<Record<string, string>>({});
  const [phMethod, setPhMethod] = useState<"strip" | "meter">("meter");
  const [note, setNote] = useState("");
  const [bottleIds, setBottleIds] = useState<string[]>([]);

  if (!target) return null;
  const bottles = target.bottles ?? [];
  const allBottles = bottles.length > 0 && bottleIds.length === 0;

  function reset() {
    setValues({});
    setNote("");
    setBottleIds([]);
  }

  function measurements(): Measurement[] {
    return [PH, TEMP, ...MORE]
      .filter((d) => values[d.key]?.trim())
      .map((d) => ({
        definitionKey: d.key,
        value: Number(values[d.key].replace(",", ".")),
        unit: d.unit,
        method: d.key === "ph" ? phMethod : null,
      }));
  }

  const ms = kind === "burp" ? [] : measurements();
  const canSave = kind === "burp" || note.trim() !== "" || ms.length > 0;

  async function save() {
    if (!target) return;
    const input: CreateLogRequest = {
      kind: kind === "taste" || kind === "note" || kind === "burp" ? kind : "measure",
      note: note.trim() || null,
      measurements: ms,
      ...(bottles.length ? { bottleIds: allBottles ? bottles.map((b) => b.id) : bottleIds } : {}),
    };
    const key = crypto.randomUUID();
    const label = target.code;
    onClose();
    reset();

    const attempt = async () => {
      const res = await logEntry(target.id, input, key);
      if (res.ok) {
        toast({ tone: "success", message: `Logged on ${label}` });
        router.refresh();
      } else {
        toast({ tone: "error", message: `Not saved: ${res.message}`, action: { label: "Retry", onClick: attempt } });
      }
    };
    await attempt();
  }

  const verb = kinds.find((k) => k.value === kind)?.verb ?? "Log";

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Log ${target.code}`}
      description={target.name}
      footer={
        <Button variant="primary" className="w-full" disabled={!canSave} onClick={save}>
          {verb}
        </Button>
      }
    >
      <div className="flex flex-col gap-5 pt-1">
        <Segmented label="What are you logging?" value={kind} onChange={setKind} options={kinds} className="w-full" />

        {bottles.length > 0 && (
          <fieldset>
            <legend className="mb-2 text-label text-ink">Bottles</legend>
            <div className="flex flex-wrap gap-2">
              <Chip pressed={allBottles} onClick={() => setBottleIds([])}>
                All {bottles.length}
              </Chip>
              {bottles.map((b) => (
                <Chip
                  key={b.id}
                  pressed={bottleIds.includes(b.id)}
                  onClick={() =>
                    setBottleIds((ids) => (ids.includes(b.id) ? ids.filter((x) => x !== b.id) : [...ids, b.id]))
                  }
                >
                  <span className="code">{b.label}</span>
                  <span className="text-ink-2">{b.flavorName}</span>
                </Chip>
              ))}
            </div>
          </fieldset>
        )}

        {kind !== "burp" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <MeasurementInput definition={PH} value={values.ph ?? ""} onChange={(v) => setValues((s) => ({ ...s, ph: v }))} />
              <div role="radiogroup" aria-label="pH method" className="flex gap-1">
                {(["meter", "strip"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={phMethod === m}
                    onClick={() => setPhMethod(m)}
                    className={cx(
                      "h-8 rounded-tag px-2 text-small capitalize",
                      phMethod === m ? "bg-well font-semibold text-ink" : "text-ink-2 hover:text-ink",
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <MeasurementInput definition={TEMP} value={values.temp ?? ""} onChange={(v) => setValues((s) => ({ ...s, temp: v }))} />
          </div>
        )}

        {kind !== "burp" && (
          <details className="group">
            <summary className="flex h-11 cursor-pointer list-none items-center text-label text-action [&::-webkit-details-marker]:hidden">
              <span className="group-open:hidden">More measurements</span>
              <span className="hidden group-open:inline">Fewer measurements</span>
            </summary>
            <div className="grid grid-cols-2 gap-3 pt-1">
              {MORE.map((d) => (
                <MeasurementInput
                  key={d.key}
                  definition={d}
                  value={values[d.key] ?? ""}
                  onChange={(v) => setValues((s) => ({ ...s, [d.key]: v }))}
                />
              ))}
            </div>
          </details>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-label text-ink">{kind === "taste" ? "How does it taste?" : "Note"}</span>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder={kind === "taste" ? "Still sweet, a little vinegar at the back…" : kind === "burp" ? "Gentle hiss" : ""}
          />
        </label>
      </div>
    </Sheet>
  );
}

function Chip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cx(
        "inline-flex h-11 items-center gap-1.5 rounded-control border px-3 text-body transition-colors",
        pressed ? "border-action bg-bottle-wash text-ink" : "border-rule bg-sheet text-ink hover:border-rule-strong",
      )}
    >
      {children}
    </button>
  );
}
