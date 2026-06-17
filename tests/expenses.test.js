import test from "node:test";
import assert from "node:assert/strict";

import { convertFromBaseAmount, convertToBaseAmount } from "../src/features/expenses.js";

test("converts original currency and base currency in both directions", () => {
  assert.equal(convertToBaseAmount(10000, 0.024), 240);
  assert.equal(convertFromBaseAmount(240, 0.024), 10000);
});

test("keeps empty or invalid exchange rate safe for amount conversion", () => {
  assert.equal(convertToBaseAmount("", 0.024), 0);
  assert.equal(convertFromBaseAmount("", 0.024), 0);
  assert.equal(convertFromBaseAmount(100, 0), 100);
});
