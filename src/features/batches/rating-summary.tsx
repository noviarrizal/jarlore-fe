import type { Rating } from "@/lib/api/types";
import { Score } from "@/components/ui/rating";

/** Finished result: the dimensions a brewer actually tunes, plus their own verdict. */
export function RatingSummary({ rating }: { rating: Rating }) {
  const dims = [
    { label: "Overall", value: rating.overall },
    { label: "Fizz", value: rating.fizz },
    { label: "Sweet ↔ tart", value: rating.sweetTart },
    { label: "Flavour", value: rating.flavor },
  ];
  return (
    <div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
        {dims.map((d) => (
          <div key={d.label}>
            <dt className="text-small text-ink-2">{d.label}</dt>
            <dd className="mt-1">
              <Score value={d.value} label={d.label} />
            </dd>
          </div>
        ))}
      </dl>
      {(rating.offNotes.length > 0 || rating.wouldRepeat !== null) && (
        <p className="mt-3 text-small text-ink-2">
          {rating.wouldRepeat !== null && (rating.wouldRepeat ? "You'd brew this again." : "You wouldn't brew this again.")}
          {rating.offNotes.length > 0 && ` Off-notes: ${rating.offNotes.join(", ")}.`}
        </p>
      )}
      {rating.note && <p className="note mt-2 max-w-prose text-body-lg">{rating.note}</p>}
    </div>
  );
}
