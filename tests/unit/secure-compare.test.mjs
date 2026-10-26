import test from "node:test";
import assert from "node:assert/strict";
import { secureCompare } from "../../src/lib/secure-compare.ts";

test("secureCompare returns true for identical strings", () => {
  assert.equal(secureCompare("admin1234", "admin1234"), true);
});

test("secureCompare returns false for different strings of equal length", () => {
  assert.equal(secureCompare("admin1234", "admin1235"), false);
});

test("secureCompare returns false for different lengths without throwing", () => {
  assert.equal(secureCompare("short", "a-much-longer-password"), false);
  assert.equal(secureCompare("a-much-longer-password", "short"), false);
});

test("secureCompare handles empty and unicode values", () => {
  assert.equal(secureCompare("", ""), true);
  assert.equal(secureCompare("", "not-empty"), false);
  assert.equal(secureCompare("pässwörd-✓", "pässwörd-✓"), true);
  assert.equal(secureCompare("pässwörd-✓", "pässwörd-✗"), false);
});
