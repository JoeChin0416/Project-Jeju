import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { AVATAR_PRESETS, getDefaultAvatarForIndex, resolveAvatarUrl } from "../src/features/avatar-presets.js";

test("provides ten built-in avatar presets", () => {
  assert.equal(AVATAR_PRESETS.length, 10);
  assert.equal(new Set(AVATAR_PRESETS.map((avatar) => avatar.id)).size, 10);
  assert.ok(AVATAR_PRESETS.every((avatar) => avatar.url.includes("/assets/avatars/") && avatar.url.endsWith(".png")));
  assert.ok(AVATAR_PRESETS.every((avatar) => existsSync(fileURLToPath(avatar.url))));
});

test("cycles default avatars by member index", () => {
  assert.equal(getDefaultAvatarForIndex(10).id, AVATAR_PRESETS[0].id);
});

test("replaces old svg presets without overwriting custom uploaded avatars", () => {
  const preset = AVATAR_PRESETS[0];

  assert.equal(resolveAvatarUrl(preset.id, "data:image/svg+xml,%3Csvg%3E%3C/svg%3E"), preset.url);
  assert.equal(resolveAvatarUrl(preset.id, "data:image/jpeg;base64,custom"), "data:image/jpeg;base64,custom");
});
