import test from "node:test";
import assert from "node:assert/strict";

import { normalizeAuthError } from "../src/services/auth.js";

test("explains disabled Firebase Auth user creation in readable Chinese", () => {
  const error = normalizeAuthError({ code: "auth/admin-restricted-operation" });

  assert.match(error.message, /禁止終端使用者建立帳號/);
  assert.match(error.message, /白名單只控制 App 資料權限/);
});

test("passes through unrelated auth errors", () => {
  const error = new Error("other");

  assert.equal(normalizeAuthError(error), error);
});
