"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { FinishRequest } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { finishBatch, finishBottle } from "./actions";

type Target = { type: "batch" | "bottle"; id: string; title: string };
type ScoreValue = "" | "1" | "2" | "3" | "4" | "5";

const scores = ["1", "2", "3", "4", "5"].map((v) => ({ value: v as ScoreValue, label: v }));
const optionalScores = [{ value: "" as ScoreValue, label: "–" }, ...scores];

/**
 * Finish & rate. A batch closes its open bottles too (they can still be rated after).
 * Ratings are history: once saved they don't change, so the sheet says so.
 */
export function FinishButton({ target, variant = "secondary", label }: { target: Target; variant?: "primary" | "secondary"; label?: string }) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(0);
  return (
    <>
      <Button
        variant={variant}
        icon={<Check className="size-4" aria-hidden />}
        onClick={() => {
          setKey((k) => k + 1);
          setOpen(true);
        }}
      >
        {label ?? "Finish & rate"}
      </Button>
      <FinishSheet key={key} target={target} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function FinishSheet({ target, open, onClose }: { target: Target; open: boolean; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [overall, setOverall] = useState<ScoreValue>("");
  const [fizz, setFizz] = useState<ScoreValue>("");
  const [sweetTart, setSweetTart] = useState<ScoreValue>("");
  const [flavor, setFlavor] = useState<ScoreValue>("");
  const [repeat, setRepeat] = useState<"" | "yes" | "no">("");
  const [offNotes, setOffNotes] = useState("");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const num = (v: ScoreValue) => (v === "" ? null : Number(v));

  function save() {
    const input: FinishRequest = {
      rating: {
        overall: Number(overall),
        fizz: num(fizz),
        sweetTart: num(sweetTart),
        flavor: num(flavor),
        offNotes: offNotes.split(",").map((s) => s.trim()).filter(Boolean),
        wouldRepeat: repeat === "" ? null : repeat === "yes",
        note: note.trim() || null,
      },
    };
    startTransition(async () => {
      const res = target.type === "batch" ? await finishBatch(target.id, input, idempotencyKey) : await finishBottle(target.id, input, idempotencyKey);
      if (res.ok) {
        onClose();
        toast({ tone: "success", message: `Rated ${target.title}` });
        router.refresh();
      } else {
        toast({ tone: "error", message: `Not saved: ${res.message}`, action: { label: "Retry", onClick: save } });
      }
    });
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Finish & rate ${target.title}`}
      description={target.type === "batch" ? "Open bottles finish with it. You can still rate them afterwards." : "Saved ratings are kept as history."}
      footer={
        <Button variant="primary" className="w-full" disabled={overall === "" || pending} onClick={save}>
          {pending ? "Saving…" : "Save rating"}
        </Button>
      }
    >
      <div className="flex flex-col gap-5 pt-1">
        <ScoreField label="Overall" value={overall} onChange={setOverall} options={scores} />
        <ScoreField label="Fizz" value={fizz} onChange={setFizz} options={optionalScores} />
        <ScoreField label="Sweet (1) ↔ tart (5)" value={sweetTart} onChange={setSweetTart} options={optionalScores} />
        <ScoreField label="Flavour" value={flavor} onChange={setFlavor} options={optionalScores} />
        <div className="flex flex-col gap-1.5">
          <span className="text-label text-ink">Would you brew it again?</span>
          <Segmented
            label="Would you brew it again?"
            value={repeat}
            onChange={setRepeat}
            options={[
              { value: "", label: "Not sure" },
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
          />
        </div>
        <Field label="Off-notes" hint="Separate with commas, e.g. vinegary, yeasty">
          {(p) => <Input {...p} value={offNotes} onChange={(e) => setOffNotes(e.target.value)} />}
        </Field>
        <Field label="How did it turn out?">
          {(p) => <Textarea {...p} rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Big fizz, sharp ginger, a bit too sweet" />}
        </Field>
      </div>
    </Sheet>
  );
}

function ScoreField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: ScoreValue;
  onChange: (v: ScoreValue) => void;
  options: { value: ScoreValue; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-label text-ink">{label}</span>
      <Segmented label={label} value={value} onChange={onChange} options={options} className="w-full" />
    </div>
  );
}
