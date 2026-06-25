import test from "node:test";
import assert from "node:assert/strict";

test("avatar preview modal renders a real close label", async () => {
  globalThis.localStorage = globalThis.localStorage ?? {
    getItem: () => "",
    setItem: () => {},
    removeItem: () => {},
  };

  const [{ settingsView }, { state }] = await Promise.all([
    import("../src/views/settings-view.js"),
    import("../src/state/app-state.js"),
  ]);

  state.user = { mode: "demo", uid: "u1", email: "demo@example.com" };
  state.accessSettings = { googleWhitelist: [], memberEmails: [], adminEmails: [] };
  state.modal = { type: "avatar-preview", url: "data:image/png;base64,avatar", label: "avatar" };

  const view = settingsView({
    id: "trip",
    members: [],
    name: "",
    destination: "",
    startDate: "",
    endDate: "",
    dailyBudget: 0,
  }, () => {});

  assert.match(view.html, /data-close-avatar-preview-button/);
  assert.doesNotMatch(view.html, />undefined</);
  assert.match(view.html, />關閉</);

  state.modal = null;
});

test("non-member admin settings do not prompt for a personal trip role", async () => {
  globalThis.localStorage = globalThis.localStorage ?? {
    getItem: () => "",
    setItem: () => {},
    removeItem: () => {},
  };

  const [{ settingsView }, { state }] = await Promise.all([
    import("../src/views/settings-view.js"),
    import("../src/state/app-state.js"),
  ]);

  state.user = { mode: "firebase", uid: "admin-uid", email: "joe.chin@joe.com.tw", authProvider: "google.com" };
  state.accessSettings = {
    googleWhitelist: [],
    memberEmails: ["friend@example.com"],
    adminEmails: ["joe.chin@joe.com.tw"],
  };
  state.modal = null;

  const view = settingsView({
    id: "trip",
    members: [{ id: "friend", name: "Friend", email: "friend@example.com", uid: "friend-uid" }],
    name: "Jeju",
    destination: "Jeju",
    startDate: "2026-06-21",
    endDate: "2026-06-25",
    dailyBudget: 0,
  }, () => {});

  assert.doesNotMatch(view.html, /data-my-role-form/);
  assert.match(view.html, /data-whitelist-form/);
  assert.doesNotMatch(view.html, /joe\.chin@joe\.com\.tw<\/p>/);

  state.user = null;
  state.accessSettings = null;
});

test("whitelist removal requires explicit confirmation", async () => {
  const { confirmWhitelistRemoval } = await import("../src/views/settings-view.js");
  const calls = [];

  assert.equal(confirmWhitelistRemoval("friend@example.com", (message) => {
    calls.push(message);
    return false;
  }), false);
  assert.deepEqual(calls, ["確定要從 Google 登入白名單移除 friend@example.com？"]);

  assert.equal(confirmWhitelistRemoval("friend@example.com", () => true), true);
});
