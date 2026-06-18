import test from "node:test";
import assert from "node:assert/strict";

import { buildDefaultRatioWeights, buildSplitPreview, buildSplitValues } from "../src/features/split-values.js";

test("keeps equal split values empty", () => {
  assert.deepEqual(buildSplitValues(["a", "b"], "equal", {}, 200), {});
});

test("defaults ratio split values to equal weights when empty", () => {
  assert.deepEqual(buildSplitValues(["a", "b"], "ratio", {}, 200), { a: 1, b: 1 });
});

test("builds default slider weights from current participants", () => {
  assert.deepEqual(buildDefaultRatioWeights(["a", "b"]), { a: 50, b: 50 });
  assert.deepEqual(buildDefaultRatioWeights(["a", "b", "c"]), { a: 33, b: 33, c: 33 });
  assert.deepEqual(buildDefaultRatioWeights(["a", "b", "c", "d"]), { a: 25, b: 25, c: 25, d: 25 });
});

test("normalizes fixed split values and fills empty manual amounts equally", () => {
  assert.deepEqual(buildSplitValues(["a", "b"], "fixed", {}, 201), { a: 100.5, b: 100.5 });
  assert.deepEqual(buildSplitValues(["a", "b"], "fixed", { a: "120", b: "81" }, 201), { a: 120, b: 81 });
});

test("builds visible split percentages for equal and ratio modes", () => {
  assert.deepEqual(buildSplitPreview(["a", "b", "c"], "equal"), { a: 33, b: 33, c: 33 });
  assert.deepEqual(buildSplitPreview(["a", "b"], "ratio", { a: 3, b: 1 }), { a: 75, b: 25 });
});
