import test from "node:test";
import assert from "node:assert/strict";

import { buildSplitValues } from "../src/features/split-values.js";

test("keeps equal split values empty", () => {
  assert.deepEqual(buildSplitValues(["a", "b"], "equal", {}, 200), {});
});

test("defaults ratio split values to equal weights when empty", () => {
  assert.deepEqual(buildSplitValues(["a", "b"], "ratio", {}, 200), { a: 1, b: 1 });
});

test("normalizes fixed split values and fills empty manual amounts equally", () => {
  assert.deepEqual(buildSplitValues(["a", "b"], "fixed", {}, 201), { a: 100.5, b: 100.5 });
  assert.deepEqual(buildSplitValues(["a", "b"], "fixed", { a: "120", b: "81" }, 201), { a: 120, b: 81 });
});
