import type { BatchStage, FermentationTypeId, LogKind, Measurement, ReminderKind } from "@/lib/api/types";

/** Display timezone. Will come from the profile (GET /v1/me) once auth exists. */
export const DISPLAY_TZ = "Europe/London";

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

const dateFmt = new Intl.DateTimeFormat("en-GB", { timeZone: DISPLAY_TZ, day: "numeric", month: "short" });
const dateYearFmt = new Intl.DateTimeFormat("en-GB", { timeZone: DISPLAY_TZ, day: "numeric", month: "short", year: "numeric" });
const weekdayFmt = new Intl.DateTimeFormat("en-GB", { timeZone: DISPLAY_TZ, weekday: "short", day: "numeric", month: "short" });
const longDayFmt = new Intl.DateTimeFormat("en-GB", { timeZone: DISPLAY_TZ, weekday: "long", day: "numeric", month: "long" });
const timeFmt = new Intl.DateTimeFormat("en-GB", { timeZone: DISPLAY_TZ, hour: "2-digit", minute: "2-digit" });
const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: DISPLAY_TZ, year: "numeric", month: "2-digit", day: "2-digit" });

export const formatDate = (iso: string) => dateFmt.format(new Date(iso));
export const formatDateYear = (iso: string) => dateYearFmt.format(new Date(iso));
export const formatTime = (iso: string) => timeFmt.format(new Date(iso));
export const formatLongDay = (iso: string) => longDayFmt.format(new Date(iso));

/** "Today", "Yesterday", or "Mon 3 Nov". */
export function relativeDay(iso: string, now: string): string {
  const a = ymd.format(new Date(iso));
  const b = ymd.format(new Date(now));
  if (a === b) return "Today";
  if (ymd.format(new Date(new Date(now).getTime() - DAY)) === a) return "Yesterday";
  if (ymd.format(new Date(new Date(now).getTime() + DAY)) === a) return "Tomorrow";
  return weekdayFmt.format(new Date(iso));
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
  const decimals = m.definitionKey === "sg" ? 3 : m.definitionKey === "ph" || m.definitionKey === "brix" ? 1 : m.value % 1 ? 1 : 0;
  return {
    label: measurementLabel[m.definitionKey] ?? m.definitionKey,
    value: m.value.toFixed(decimals),
    unit: m.definitionKey === "ph" ? "" : m.unit,
  };
}

export function formatAmount(amount: number | null, unit: string | null): string {
  if (amount === null) return "—";
  const n = Number.isInteger(amount) ? String(amount) : amount.toFixed(1);
  return unit ? `${n} ${unit}` : n;
}

export function formatVolume(ml: number): string {
  return ml >= 1000 ? `${(ml / 1000).toFixed(ml % 1000 ? 1 : 0)} L` : `${ml} ml`;
}
