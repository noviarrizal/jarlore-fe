"use client";

import { BookmarkPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { saveAsRecipe } from "./actions";

type Target = { type: "batch" | "bottle"; id: string; title: string };

/**
 * Save as recipe: a new recipe (v1), or the next version of one you already have.
 * A batch becomes a base recipe; a bottle becomes an F2 bottle recipe.
 * Versions never change afterwards; jarlore-be refuses a version identical to the latest.
 */
export function SaveRecipeButton({
  target,
  defaultName,
  recipes,
  size = "md",
}: {
  target: Target;
  defaultName: string;
  recipes: { id: string; name: string; versionCount: number }[];
  size?: "md" | "sm";
}) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(0);
  return (
    <>
      <Button
        size={size}
        icon={<BookmarkPlus className="size-4" aria-hidden />}
        onClick={() => {
          setKey((k) => k + 1);
          setOpen(true);
        }}
      >
        Save as recipe
      </Button>
      <SaveRecipeSheet key={key} target={target} defaultName={defaultName} recipes={recipes} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function SaveRecipeSheet({
  target,
  defaultName,
  recipes,
  open,
  onClose,
}: {
  target: Target;
  defaultName: string;
  recipes: { id: string; name: string; versionCount: number }[];
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [mode, setMode] = useState<"new" | "version">("new");
  const [name, setName] = useState(defaultName);
  const [recipeId, setRecipeId] = useState(recipes[0]?.id ?? "");
  const [changeNote, setChangeNote] = useState("");
  const [pending, startTransition] = useTransition();
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const kind = target.type === "bottle" ? "bottle recipe" : "recipe";

  function save() {
    const input = mode === "new" ? { name: name.trim(), changeNote: changeNote.trim() || null } : { recipeId, changeNote: changeNote.trim() || null };
    startTransition(async () => {
      const res = await saveAsRecipe(target, input, idempotencyKey);
      if (res.ok) {
        onClose();
        toast({ tone: "success", message: `Saved as ${res.data.name} v${res.data.latestVersion.versionNo}` });
        router.push(`/recipes/${res.data.id}`);
      } else {
        toast({ tone: "error", message: `Not saved: ${res.message}`, action: res.code === "no_changes" ? undefined : { label: "Retry", onClick: save } });
      }
    });
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Save ${target.title} as a ${kind}`}
      description={
        target.type === "bottle"
          ? "Keeps this bottle's flavour, additions, priming sugar and headspace, to reuse when you bottle again."
          : "Keeps the ingredients per litre and the planned F1, to brew again from."
      }
      footer={
        <Button variant="primary" className="w-full" disabled={pending || (mode === "new" ? !name.trim() : !recipeId)} onClick={save}>
          {pending ? "Saving…" : mode === "new" ? "Save recipe" : "Save new version"}
        </Button>
      }
    >
      <div className="flex flex-col gap-5 pt-1">
        {recipes.length > 0 && (
          <Segmented
            label="Save as"
            value={mode}
            onChange={setMode}
            options={[
              { value: "new", label: "New recipe" },
              { value: "version", label: "New version" },
            ]}
            className="w-full"
          />
        )}
        {mode === "new" ? (
          <Field label="Recipe name">{(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />}</Field>
        ) : (
          <Field label="Recipe" hint="Earlier versions stay exactly as they were.">
            {(p) => (
              <Select {...p} value={recipeId} onChange={(e) => setRecipeId(e.target.value)}>
                {recipes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (next: v{r.versionCount + 1})
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}
        <Field label="What makes this version worth keeping?" hint="Optional. You'll see it in the recipe's history.">
          {(p) => <Textarea {...p} rows={2} value={changeNote} onChange={(e) => setChangeNote(e.target.value)} placeholder="Juice gave the cleanest ginger and the best fizz" />}
        </Field>
      </div>
    </Sheet>
  );
}
