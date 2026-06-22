import test from "node:test";
import assert from "node:assert/strict";

import {
  buildDefaultRatioWeights,
  buildSplitPreview,
  buildSplitValues,
  readSplitValuesFromForm,
  shouldFillMissingRatioInput,
} from "../src/features/split-values.js";

test("keeps equal split values empty", () => {
  assert.deepEqual(buildSplitValues(["a", "b"], "equal", {}, 200), {});
});

test("defaults ratio split values to equal weights when empty", () => {
  assert.deepEqual(buildSplitValues(["a", "b"], "ratio", {}, 200), { a: 1, b: 1 });
});

test("builds default ratio weights from current participants", () => {
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

test("reads ratio or fixed split values from the matching controls only", () => {
  const form = {
    querySelectorAll(selector) {
      if (selector === "[data-split-fixed-value]") {
        return [
          { dataset: { splitFixedValue: "a" }, value: "120" },
          { dataset: { splitFixedValue: "b" }, value: "80" },
        ];
      }
      if (selector === "[data-split-ratio-value], [data-split-value]") {
        return [
          { dataset: { splitRatioValue: "a" }, value: "70" },
          { dataset: { splitRatioValue: "b" }, value: "30" },
        ];
      }
      return [];
    },
  };

  assert.deepEqual(readSplitValuesFromForm(form, "ratio"), { a: "70", b: "30" });
  assert.deepEqual(readSplitValuesFromForm(form, "fixed"), { a: "120", b: "80" });
});

test("keeps a ratio input empty while the user is deleting its default value", () => {
  const editedInput = { value: "" };
  const untouchedInput = { value: "" };

  assert.equal(shouldFillMissingRatioInput(editedInput, editedInput), false);
  assert.equal(shouldFillMissingRatioInput(untouchedInput, editedInput), true);
  assert.equal(shouldFillMissingRatioInput({ value: "" }, null), true);
  assert.equal(shouldFillMissingRatioInput({ value: "0" }, { value: "0" }), false);
});

test("does not refill a ratio field that the user already cleared", () => {
  const alreadyClearedInput = { value: "", dataset: { ratioUserCleared: "true" } };
  const anotherEditedInput = { value: "30", dataset: {} };

  assert.equal(shouldFillMissingRatioInput(alreadyClearedInput, anotherEditedInput), false);
});
