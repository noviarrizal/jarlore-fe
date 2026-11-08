import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanTimezone, devAuthUrlFrom, secondsLeft } from "./cookies.ts";

const jwt = (payload: object) => `e30.${btoa(JSON.stringify(payload)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_")}.sig`;

test("secondsLeft reads exp without trusting anything else", () => {
  const now = Date.UTC(2026, 10, 8, 12, 0, 0);
  assert.equal(secondsLeft(jwt({ exp: now / 1000 + 600 }), now), 600);
  assert.equal(secondsLeft(jwt({ exp: now / 1000 - 5 }), now), -5);
  assert.equal(secondsLeft(jwt({ sub: "x" }), now), null);
  assert.equal(secondsLeft("not-a-jwt", now), null);
  assert.equal(secondsLeft("a.%%%.c", now), null);
  assert.equal(secondsLeft(undefined, now), null);
});

test("cleanTimezone accepts IANA names only", () => {
  assert.equal(cleanTimezone("Asia/Jakarta"), "Asia/Jakarta");
  assert.equal(cleanTimezone("America/New_York"), "America/New_York");
  assert.equal(cleanTimezone("Mars/Base"), null);
  assert.equal(cleanTimezone("Local"), null);
  assert.equal(cleanTimezone(""), null);
  assert.equal(cleanTimezone(undefined), null);
  assert.equal(cleanTimezone("x".repeat(80)), null);
});

test("development sign-in is loopback-only and never in production", () => {
  assert.equal(devAuthUrlFrom("development", "http://127.0.0.1:9999/"), "http://127.0.0.1:9999");
  assert.equal(devAuthUrlFrom("development", "http://localhost:9999"), "http://localhost:9999");
  assert.equal(devAuthUrlFrom("production", "http://127.0.0.1:9999"), null);
  assert.equal(devAuthUrlFrom("development", "https://auth.example.com"), null);
  assert.equal(devAuthUrlFrom("development", "http://10.0.0.5:9999"), null);
  assert.equal(devAuthUrlFrom("development", undefined), null);
  assert.equal(devAuthUrlFrom("test", "not a url"), null);
});
