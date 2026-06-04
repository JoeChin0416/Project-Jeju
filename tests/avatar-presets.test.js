import test from "node:test";
import assert from "node:assert/strict";

import { AVATAR_PRESETS, getDefaultAvatarForIndex } from "../src/features/avatar-presets.js";

test("provides ten built-in avatar presets", () => {
  assert.equal(AVATAR_PRESETS.length, 10);
  assert.equal(new Set(AVATAR_PRESETS.map((avatar) => avatar.id)).size, 10);
  assert.ok(AVATAR_PRESETS.every((avatar) => avatar.url.startsWith("data:image/svg+xml")));
});

test("cycles default avatars by member index", () => {
  assert.equal(getDefaultAvatarForIndex(10).id, AVATAR_PRESETS[0].id);
});
