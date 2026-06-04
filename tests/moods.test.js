import test from "node:test";
import assert from "node:assert/strict";

import { getMood, normalizeMoodId, TRIP_MOODS } from "../src/features/moods.js";

test("defines six itinerary mood stickers with generated image urls", () => {
  assert.equal(TRIP_MOODS.length, 6);
  assert.deepEqual(TRIP_MOODS.map((mood) => mood.id), [
    "excited",
    "relaxed",
    "shopping",
    "tired",
    "pretty",
    "oops",
  ]);
  assert.ok(TRIP_MOODS.every((mood) => mood.iconUrl.startsWith("data:image/svg+xml,")));
});

test("normalizes unknown mood ids to empty mood", () => {
  assert.equal(getMood("shopping").label, "\u7206\u8cb7");
  assert.equal(normalizeMoodId("shopping"), "shopping");
  assert.equal(normalizeMoodId("missing"), "");
});
