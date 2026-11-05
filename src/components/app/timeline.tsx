import type { Bottle, LogEntry } from "@/lib/api/types";
import { cx } from "@/components/ui/cx";
import { formatMeasurement, formatTime, logKindName, relativeDay } from "@/lib/format";

/**
 * Batch history, newest first, grouped by day. Measured values in the mono voice,
 * the brewer's own words in the casual voice. A bottle-specific entry carries its label.
 */
export function Timeline({ logs, bottles = [], now }: { logs: LogEntry[]; bottles?: Bottle[]; now: string }) {
  if (logs.length === 0) {
    return <p className="text-body text-ink-2">Nothing logged yet. Your first taste or pH reading will show up here.</p>;
  }

  const groups: { day: string; entries: LogEntry[] }[] = [];
  for (const l of logs) {
    const day = relativeDay(l.occurredAt, now);
    const g = groups.at(-1);
    if (g && g.day === day) g.entries.push(l);
    else groups.push({ day, entries: [l] });
  }

  return (
    <ol className="flex flex-col gap-5">
      {groups.map((g) => (
        <li key={g.day}>
          <h3 className="text-label text-ink-2">{g.day}</h3>
          <ol className="mt-2 border-l-2 border-rule">
            {g.entries.map((l) => {
              const bottle = bottles.find((b) => b.id === l.bottleId);
              return (
                <li key={l.id} className="relative pb-3 pl-4 last:pb-0">
                  <span
                    aria-hidden
                    className={cx(
                      "absolute top-1.5 -left-[5px] size-2 rounded-full",
                      l.kind === "stage_change" ? "bg-tea" : l.kind === "issue" ? "bg-danger" : "bg-rule-strong",
                    )}
                  />
                  <div className="flex flex-wrap items-baseline gap-x-2 text-small text-ink-2">
                    <span className="num">{formatTime(l.occurredAt)}</span>
                    <span className="font-semibold text-ink">{logKindName[l.kind]}</span>
                    {bottle && (
                      <span>
                        bottle <span className="code text-ink">{bottle.label}</span>
                      </span>
                    )}
                  </div>
                  {l.measurements.length > 0 && (
                    <dl className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                      {l.measurements.map((m) => {
                        const f = formatMeasurement(m);
                        return (
                          <div key={m.definitionKey} className="flex items-baseline gap-1.5">
                            <dt className="text-small text-ink-2">{f.label}</dt>
                            <dd className="num text-body">
                              {f.value}
                              {f.unit && <span className="text-small text-ink-3"> {f.unit}</span>}
                              {m.method && <span className="text-small text-ink-3"> ({m.method})</span>}
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                  )}
                  {l.note && <p className="note mt-1 max-w-prose text-body">{l.note}</p>}
                </li>
              );
            })}
          </ol>
        </li>
      ))}
    </ol>
  );
}
