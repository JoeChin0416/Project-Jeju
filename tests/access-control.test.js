import test from "node:test";
import assert from "node:assert/strict";

import {
  addGoogleWhitelistEmail,
  canManageAccess,
  checkGoogleAccess,
  removeGoogleWhitelistEmail,
} from "../src/services/access-control.js";

test("allows email login accounts to manage Google whitelist", () => {
  assert.equal(canManageAccess({ mode: "firebase", authProvider: "password" }), true);
  assert.equal(canManageAccess({ mode: "firebase", authProvider: "google.com" }), false);
});

test("does not restrict email login accounts", () => {
  const result = checkGoogleAccess(
    { mode: "firebase", authProvider: "password", email: "admin@example.com" },
    { googleWhitelist: ["friend@gmail.com"] },
  );

  assert.equal(result.allowed, true);
});

test("blocks Google accounts while whitelist is empty", () => {
  const result = checkGoogleAccess(
    { mode: "firebase", authProvider: "google.com", email: "friend@gmail.com" },
    { googleWhitelist: [] },
  );

  assert.equal(result.allowed, false);
  assert.match(result.reason, /白名單/);
});

test("blocks Google accounts until access settings have been initialized", () => {
  const result = checkGoogleAccess(
    { mode: "firebase", authProvider: "google.com", email: "friend@gmail.com" },
    null,
  );

  assert.equal(result.allowed, false);
  assert.match(result.reason, /Email 登入/);
});

test("blocks Google accounts missing from whitelist", () => {
  const result = checkGoogleAccess(
    { mode: "firebase", authProvider: "google.com", email: "stranger@gmail.com" },
    { googleWhitelist: ["friend@gmail.com"] },
  );

  assert.equal(result.allowed, false);
  assert.match(result.reason, /尚未開放/);
});

test("normalizes whitelist email add and remove", () => {
  const settings = addGoogleWhitelistEmail(
    { googleWhitelist: ["friend@gmail.com"] },
    " Friend@Gmail.com ",
  );

  assert.deepEqual(settings.googleWhitelist, ["friend@gmail.com"]);
  assert.deepEqual(removeGoogleWhitelistEmail(settings, "FRIEND@gmail.com").googleWhitelist, []);
});
