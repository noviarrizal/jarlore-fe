import type { BatchStage, BatchStatus } from "@/lib/api/types";
import { cx } from "./cx";
import { BottleGlyph, JarGlyph } from "./glyphs";

/**
 * Stage is the only thing in Jarlore that gets a colour: F1 = tea amber (liquid in a jar),
 * F2 = bottle green (glass), done = ink. Fermentation type is shown as a word, never a colour.
 */
export function StageTag({
  stage,
  status,
  detail,
  className,
}: {
  stage: BatchStage;
  status?: BatchStatus;
  detail?: string;
  className?: string;
}) {
  if (status === "discarded") {
    return <Tag className={cx("bg-danger-wash text-danger", className)}>Discarded</Tag>;
  }
  if (stage === "f1") {
    return (
      <Tag className={cx("bg-tea-wash text-tea-ink", className)}>
        <JarGlyph className="size-3.5" />
        F1{detail ? ` ${detail}` : ""}
      </Tag>
    );
  }
  if (stage === "f2") {
    return (
      <Tag className={cx("bg-bottle-wash text-action", className)}>
        <BottleGlyph className="size-3.5" />
        F2{detail ? ` ${detail}` : ""}
      </Tag>
    );
  }
  return <Tag className={cx("bg-well text-ink-2", className)}>Finished{detail ? `, ${detail}` : ""}</Tag>;
}

export function Tag({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cx(
        "inline-flex h-6 items-center gap-1 rounded-tag px-1.5 text-label whitespace-nowrap",
        className ?? "bg-well text-ink-2",
      )}
    >
      {children}
    </span>
  );
}
