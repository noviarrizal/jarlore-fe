import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { formatDate, formatLongDay, formatTime, localDay, relativeDay } from "./format.ts";

// Run with `pnpm test:unit` (Node's test runner; types are stripped natively).

describe("times read in the user's own zone", () => {
  // A log written at 21:54 WIB on 8 November 2026 is stored as 14:54 UTC.
  const log = "2026-11-08T14:54:00Z";

  test("Asia/Jakarta (UTC+7, no DST)", () => {
    assert.equal(formatTime(log, "Asia/Jakarta"), "21:54");
    assert.equal(formatDate(log, "Asia/Jakarta"), "8 Nov");
  });
  test("Europe/London (GMT in November)", () => {
    assert.equal(formatTime(log, "Europe/London"), "14:54");
  });
  test("America/New_York (EST in November)", () => {
    assert.equal(formatTime(log, "America/New_York"), "09:54");
  });
  test("the calendar day depends on the zone", () => {
    const evening = "2026-11-08T20:00:00Z";
    assert.equal(formatDate(evening, "Asia/Jakarta"), "9 Nov");
    assert.equal(formatDate(evening, "America/New_York"), "8 Nov");
    assert.equal(formatLongDay(evening, "Asia/Jakarta"), "Monday 9 November");
  });
});

describe("daylight saving transitions", () => {
  test("London springs forward on 29 March 2026", () => {
    assert.equal(formatTime("2026-03-29T00:30:00Z", "Europe/London"), "00:30");
    assert.equal(formatTime("2026-03-29T01:30:00Z", "Europe/London"), "02:30");
  });
  test("New York falls back on 1 November 2026 (01:30 happens twice)", () => {
    assert.equal(formatTime("2026-11-01T05:30:00Z", "America/New_York"), "01:30");
    assert.equal(formatTime("2026-11-01T06:30:00Z", "America/New_York"), "01:30");
  });
  test("Yesterday across the 25-hour day in New York", () => {
    // 00:30 EDT on 1 Nov, seen at 00:30 EST on 2 Nov (25 hours later).
    assert.equal(relativeDay("2026-11-01T04:30:00Z", "2026-11-02T05:30:00Z", "America/New_York"), "Yesterday");
  });
});

describe("Today / Yesterday follow local midnight", () => {
  test("one minute past midnight in Jakarta is Tomorrow there, Today in London", () => {
    const now = "2026-11-08T16:59:00Z"; // 23:59 WIB
    const later = "2026-11-08T17:01:00Z"; // 00:01 WIB, 9 Nov
    assert.equal(relativeDay(later, now, "Asia/Jakarta"), "Tomorrow");
    assert.equal(relativeDay(later, now, "Europe/London"), "Today");
  });
  test("half an hour before local midnight is Yesterday once the day turns", () => {
    const now = "2026-11-08T17:30:00Z"; // 00:30 WIB, 9 Nov
    const log = "2026-11-08T16:30:00Z"; // 23:30 WIB, 8 Nov
    assert.equal(relativeDay(log, now, "Asia/Jakarta"), "Yesterday");
    assert.equal(relativeDay(log, now, "Europe/London"), "Today");
  });
  test("older days show the weekday and date", () => {
    assert.equal(relativeDay("2026-11-03T10:00:00Z", "2026-11-08T10:00:00Z", "Europe/London"), "Tue 3 Nov");
  });
  test("localDay is the zone's calendar date", () => {
    assert.equal(localDay("2026-11-08T17:01:00Z", "Asia/Jakarta"), "2026-11-09");
    assert.equal(localDay("2026-11-08T17:01:00Z", "America/New_York"), "2026-11-08");
  });
});

describe("bad zones never break a page", () => {
  test("an unknown zone falls back to UTC", () => {
    assert.equal(formatTime("2026-11-08T14:54:00Z", "Mars/Olympus_Mons"), "14:54");
    assert.equal(relativeDay("2026-11-08T14:54:00Z", "2026-11-08T15:00:00Z", "Not/AZone"), "Today");
  });
});
