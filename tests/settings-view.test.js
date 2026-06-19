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
