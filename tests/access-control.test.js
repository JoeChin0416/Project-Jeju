import test from "node:test";
import assert from "node:assert/strict";

import {
  addGoogleWhitelistEmail,
  canManageAccess,
  checkGoogleAccess,
  checkUserAccess,
  removeGoogleWhitelistEmail,
} from "../src/services/access-control.js";

test("allows only owners and configured admins to manage Google whitelist", () => {
  assert.equal(canManageAccess({ mode: "firebase", authProvider: "password", email: "dpluschin0416@gmail.com" }), true);
  assert.equal(canManageAccess({ mode: "firebase", authProvider: "password", email: "member@example.com" }, { adminEmails: [] }), false);
  assert.equal(canManageAccess({ mode: "firebase", authProvider: "google.com", email: "admin@example.com" }, { adminEmails: ["admin@example.com"] }), true);
});

test("blocks password users that are not owner admin or trip members", () => {
  const result = checkUserAccess(
    { mode: "firebase", authProvider: "password", email: "stranger@example.com" },
    { googleWhitelist: ["friend@gmail.com"], memberEmails: ["member@example.com"], adminEmails: [] },
  );

  assert.equal(result.allowed, false);
  assert.match(result.reason, /旅伴角色/);
});

test("blocks Google accounts while whitelist is empty", () => {
  const result = checkGoogleAccess(
    { mode: "firebase", authProvider: "google.com", email: "friend@gmail.com" },
    { googleWhitelist: [] },
  );

  assert.equal(result.allowed, false);
  assert.match(result.reason, /白名單/);
});

test("allows whitelisted Google accounts before their trip role is created", () => {
  const result = checkGoogleAccess(
    { mode: "firebase", authProvider: "google.com", email: "friend@gmail.com" },
    { googleWhitelist: ["friend@gmail.com"], memberEmails: [], adminEmails: [] },
  );

  assert.equal(result.allowed, true);
});

test("blocks Google accounts until access settings have been initialized", () => {
  const result = checkGoogleAccess(
    { mode: "firebase", authProvider: "google.com", email: "friend@gmail.com" },
    null,
  );

  assert.equal(result.allowed, false);
  assert.match(result.reason, /尚未初始化/);
});

test("blocks Google accounts missing from whitelist", () => {
  const result = checkGoogleAccess(
    { mode: "firebase", authProvider: "google.com", email: "stranger@gmail.com" },
    { googleWhitelist: ["friend@gmail.com"] },
  );

  assert.equal(result.allowed, false);
  assert.match(result.reason, /尚未被加入/);
});

test("normalizes whitelist email add and remove", () => {
  const settings = addGoogleWhitelistEmail(
    { googleWhitelist: ["friend@gmail.com"] },
    " Friend@Gmail.com ",
  );

  assert.deepEqual(settings.googleWhitelist, ["friend@gmail.com"]);
  assert.deepEqual(removeGoogleWhitelistEmail(settings, "FRIEND@gmail.com").googleWhitelist, []);
});
