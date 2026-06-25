import test from "node:test";
import assert from "node:assert/strict";

import { parseFrankfurterRateResponse } from "../src/services/exchange-rate.js";
import { DEFAULT_EXCHANGE_RATE } from "../src/state/trip-store.js";

test("parses Frankfurter list response for KRW to TWD", () => {
  assert.equal(parseFrankfurterRateResponse([{ base: "KRW", quote: "TWD", rate: 0.02058 }], "TWD"), 0.02058);
});

test("parses Frankfurter object response fallback", () => {
  assert.equal(parseFrankfurterRateResponse({ rates: { TWD: 0.0206 } }, "TWD"), 0.0206);
});

test("defaults trip exchange rate to 0.021", () => {
  assert.equal(DEFAULT_EXCHANGE_RATE, 0.021);
});
