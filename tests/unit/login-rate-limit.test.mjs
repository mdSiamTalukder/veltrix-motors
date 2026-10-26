import test from "node:test";
import assert from "node:assert/strict";
import {
  LOGIN_MAX_FAILURES,
  LOGIN_WINDOW_MS,
  clearLoginFailures,
  isLoginBlocked,
  recordLoginFailure,
} from "../../src/lib/login-rate-limit.ts";

let counter = 0;
function uniqueKey() {
  counter += 1;
  return `login-limit-test:${Date.now()}:${counter}`;
}

test("a fresh key is not blocked", () => {
  assert.equal(isLoginBlocked(uniqueKey(), 1000), false);
});

test("a key becomes blocked only after reaching the failure limit", () => {
  const key = uniqueKey();
  const now = 10_000;

  for (let attempt = 1; attempt < LOGIN_MAX_FAILURES; attempt += 1) {
    recordLoginFailure(key, now);
    assert.equal(isLoginBlocked(key, now), false);
  }

  recordLoginFailure(key, now);
  assert.equal(isLoginBlocked(key, now), true);
});

test("failure counters are isolated per key", () => {
  const blockedKey = uniqueKey();
  const otherKey = uniqueKey();
  const now = 20_000;

  for (let attempt = 0; attempt < LOGIN_MAX_FAILURES; attempt += 1) {
    recordLoginFailure(blockedKey, now);
  }

  assert.equal(isLoginBlocked(blockedKey, now), true);
  assert.equal(isLoginBlocked(otherKey, now), false);
});

test("clearLoginFailures unblocks a key", () => {
  const key = uniqueKey();
  const now = 30_000;

  for (let attempt = 0; attempt < LOGIN_MAX_FAILURES; attempt += 1) {
    recordLoginFailure(key, now);
  }

  assert.equal(isLoginBlocked(key, now), true);

  clearLoginFailures(key);
  assert.equal(isLoginBlocked(key, now), false);
});

test("the block expires after the window and the counter resets", () => {
  const key = uniqueKey();
  const now = 40_000;

  for (let attempt = 0; attempt < LOGIN_MAX_FAILURES; attempt += 1) {
    recordLoginFailure(key, now);
  }

  assert.equal(isLoginBlocked(key, now + LOGIN_WINDOW_MS - 1), true);
  assert.equal(isLoginBlocked(key, now + LOGIN_WINDOW_MS), false);

  recordLoginFailure(key, now + LOGIN_WINDOW_MS);
  assert.equal(isLoginBlocked(key, now + LOGIN_WINDOW_MS), false);
});
