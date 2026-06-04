import test from "node:test";
import assert from "node:assert/strict";

import {
  estimateTravelMinutes,
  getSegmentEstimate,
  haversineKm,
} from "../src/features/distance.js";

test("calculates straight-line distance between two coordinate pairs", () => {
  const distance = haversineKm(
    { lat: 33.4996, lng: 126.5312 },
    { lat: 33.4583, lng: 126.9425 },
  );

  assert.ok(distance > 38 && distance < 39);
});

test("estimates travel minutes from distance and travel mode", () => {
  assert.equal(estimateTravelMinutes(35, "driving"), 60);
  assert.equal(estimateTravelMinutes(5, "walking"), 60);
  assert.equal(estimateTravelMinutes(25, "transit"), 60);
});

test("returns null segment estimate when coordinates are missing", () => {
  const estimate = getSegmentEstimate(
    { name: "A", lat: null, lng: 126.5 },
    { name: "B", lat: 33.4, lng: 126.9 },
    "driving",
  );

  assert.equal(estimate, null);
});
