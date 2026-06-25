import test from "node:test";
import assert from "node:assert/strict";

import { confirmDestructiveAction } from "../src/utils/confirm.js";

test("destructive actions require an explicit confirmation callback", () => {
  assert.equal(confirmDestructiveAction("delete", () => true), true);
  assert.equal(confirmDestructiveAction("delete", () => false), false);
  assert.equal(confirmDestructiveAction("delete", null), false);
});
