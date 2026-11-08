"use client";

import { Award } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { Bottle } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { updateBottle } from "./actions";
import { FinishButton } from "./finish-sheet";
import { SaveRecipeButton } from "./save-recipe-sheet";

/** What you can do with one F2 bottle: rate it while open; mark it best and save it once finished. */
export function BottleActions({
  bottle,
  batchCode,
  bottleRecipes,
}: {
  bottle: Pick<Bottle, "id" | "label" | "flavorName" | "status" | "rating" | "isReference">;
  batchCode: string;
  bottleRecipes: { id: string; name: string; versionCount: number }[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const title = `bottle ${bottle.label}`;
  const open = bottle.status === "conditioning" || bottle.status === "chilled";

  if (bottle.status === "discarded") return null;
  if (open || !bottle.rating) {
    return (
      <div className="mt-2">
        <FinishButton target={{ type: "bottle", id: bottle.id, title }} label={open ? "Finish & rate" : "Rate"} />
      </div>
    );
  }

  function toggleBest() {
    startTransition(async () => {
      const res = await updateBottle(bottle.id, { isReference: !bottle.isReference });
      if (res.ok) {
        toast({ tone: "success", message: bottle.isReference ? `Unmarked ${title}` : `Marked ${title} as the best of ${batchCode}` });
        router.refresh();
      } else {
        toast({ tone: "error", message: `Not saved: ${res.message}` });
      }
    });
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <Button
        size="sm"
        aria-pressed={bottle.isReference}
        disabled={pending}
        icon={<Award className="size-4" aria-hidden />}
        onClick={toggleBest}
        className={bottle.isReference ? "border-action bg-bottle-wash" : undefined}
      >
        {bottle.isReference ? "Best bottle" : "Mark as best"}
      </Button>
      <SaveRecipeButton size="sm" target={{ type: "bottle", id: bottle.id, title }} defaultName={`${bottle.flavorName} bottle`} recipes={bottleRecipes} />
    </div>
  );
}
