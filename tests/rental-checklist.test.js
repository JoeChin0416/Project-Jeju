import test from "node:test";
import assert from "node:assert/strict";

import {
  createRentalChecklist,
  normalizeRentalChecklist,
  toggleRentalChecklistItem,
} from "../src/features/rental-checklist.js";

test("creates insurance fuel and return checklist items", () => {
  const items = createRentalChecklist();
  const labels = items.map((item) => item.label).join(" ");

  assert.match(labels, /保險/);
  assert.match(labels, /加油/);
  assert.match(labels, /還車/);
  assert.equal(items.every((item) => item.checked === false), true);
});

test("normalizes saved checklist state while adding newly required items", () => {
  const items = normalizeRentalChecklist([{ id: "insurance", label: "確認保險方案", checked: true }]);

  assert.equal(items.find((item) => item.id === "insurance").checked, true);
  assert.equal(items.length >= 3, true);
});

test("toggles a checklist item without mutating the original array", () => {
  const items = createRentalChecklist();
  const next = toggleRentalChecklistItem(items, "fuel");

  assert.equal(items.find((item) => item.id === "fuel").checked, false);
  assert.equal(next.find((item) => item.id === "fuel").checked, true);
});
