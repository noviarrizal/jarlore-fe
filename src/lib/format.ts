import type { BatchStage, FermentationTypeId, LogKind, Measurement, ReminderKind } from "@/lib/api/types";

const DAY = 86_400_000;

export function daysBetween(from: string, to: string): number {
  return Math.floor((new Date(to).getTime() - new Date(from).getTime()) / DAY);
}

export function hoursBetween(from: string, to: string): number {
  return Math.floor((new Date(to).getTime() - new Date(from).getTime()) / 3_600_000);
}

/** "Day 8" counts the start day as day 1, the way brewers count. */
export function dayNumber(startedAt: string, now: string): number {
  return daysBetween(startedAt, now) + 1;
}

/** Water kefir moves in hours; show hours for the first two days. */
export function ageLabel(startedAt: string, now: string, type: FermentationTypeId): string {
  const hours = hoursBetween(startedAt, now);
  if (type === "water_kefir" && hours < 48) return `${hours} h`;
  return `Day ${dayNumber(startedAt, now)}`;
}

/**
 * Dates and times are shown in the user's own IANA time zone (profile.timezone,
 * GET /v1/me), passed in explicitly so server and client render the same text.
 * Stored timestamps are UTC instants; the zone only changes how they read.
 * An unknown zone falls back to UTC rather than throwing.
 */
type Formatters = {
  date: Intl.DateTimeFormat;
  dateYear: Intl.DateTimeFormat;
  weekday: Intl.DateTimeFormat;
  longDay: Intl.DateTimeFormat;
  time: Intl.DateTimeFormat;
  ymd: Intl.DateTimeFormat;
};
const formatters = new Map<string, Formatters>();

function inZone(tz: string): Formatters {
  let f = formatters.get(tz);
  if (f) return f;
  let timeZone = tz;
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone });
  } catch {
    timeZone = "UTC";
  }
  f = {
    date: new Intl.DateTimeFormat("en-GB", { timeZone, day: "numeric", month: "short" }),
    dateYear: new Intl.DateTimeFormat("en-GB", { timeZone, day: "numeric", month: "short", year: "numeric" }),
    weekday: new Intl.DateTimeFormat("en-GB", { timeZone, weekday: "short", day: "numeric", month: "short" }),
    longDay: new Intl.DateTimeFormat("en-GB", { timeZone, weekday: "long", day: "numeric", month: "long" }),
    time: new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }),
    ymd: new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }),
  };
  formatters.set(tz, f);
  return f;
}

export const formatDate = (iso: string, tz: string) => inZone(tz).date.format(new Date(iso));
export const formatDateYear = (iso: string, tz: string) => inZone(tz).dateYear.format(new Date(iso));
export const formatTime = (iso: string, tz: string) => inZone(tz).time.format(new Date(iso));
export const formatLongDay = (iso: string, tz: string) => inZone(tz).longDay.format(new Date(iso));

/** Calendar day of an instant in the zone, as YYYY-MM-DD. */
export const localDay = (iso: string, tz: string) => inZone(tz).ymd.format(new Date(iso));

/** "Today", "Yesterday", "Tomorrow" or "Mon 3 Nov", by calendar day in the user's zone. */
export function relativeDay(iso: string, now: string, tz: string): string {
  const day = localDay(iso, tz);
  const today = localDay(now, tz);
  if (day === today) return "Today";
  const diff = Math.round((Date.parse(`${day}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / DAY);
  if (diff === -1) return "Yesterday";
  if (diff === 1) return "Tomorrow";
  return inZone(tz).weekday.format(new Date(iso));
}

export const typeName: Record<FermentationTypeId, string> = {
  kombucha: "Kombucha",
  water_kefir: "Water kefir",
  custom: "Custom",
};

export const stageName: Record<BatchStage, string> = { f1: "F1", f2: "F2", done: "Done" };

export const logKindName: Record<LogKind, string> = {
  note: "Note",
  taste: "Taste",
  burp: "Burp",
  measure: "Measured",
  stage_change: "Stage",
  feed: "Fed",
  issue: "Issue",
};

export const reminderVerb: Record<ReminderKind, string> = {
  taste_check: "Taste",
  bottle: "Bottle",
  burp: "Burp",
  chill: "Chill",
  custom: "Check",
};

const measurementLabel: Record<string, string> = { ph: "pH", temp: "Temp", brix: "Brix", sg: "Gravity" };

export function formatMeasurement(m: Measurement): { label: string; value: string; unit: string } {
  const label = measurementLabel[m.definitionKey] ?? m.definitionKey.replace(/_/g, " ");
  if (typeof m.value === "boolean") return { label, value: m.value ? "Yes" : "No", unit: "" };
  if (typeof m.value === "string") return { label, value: m.value, unit: "" };
  const decimals = m.definitionKey === "sg" ? 3 : m.definitionKey === "ph" || m.definitionKey === "brix" ? 1 : m.value % 1 ? 1 : 0;
  return { label, value: m.value.toFixed(decimals), unit: m.definitionKey === "ph" ? "" : m.unit };
}

export function formatAmount(amount: number | null, unit: string | null): string {
  if (amount === null) return "—";
  const n = Number.isInteger(amount) ? String(amount) : amount.toFixed(1);
  return unit ? `${n} ${unit}` : n;
}

export function formatVolume(ml: number): string {
  return ml >= 1000 ? `${(ml / 1000).toFixed(ml % 1000 ? 1 : 0)} L` : `${ml} ml`;
}
