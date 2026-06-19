import test from "node:test";
import assert from "node:assert/strict";

import {
  buildGoogleMapsSearchUrl,
  buildNaverMapSearchUrl,
  movePlaceWithinDay,
} from "../src/features/itinerary.js";

test("builds Google and Naver map search urls from the actual place text", () => {
  const googleUrl = buildGoogleMapsSearchUrl("Olive Young Jeju", "제주시 연동");
  const naverUrl = buildNaverMapSearchUrl("Olive Young Jeju", "제주시 연동");

  assert.equal(googleUrl, "https://www.google.com/maps/search/?api=1&query=Olive%20Young%20Jeju%20%EC%A0%9C%EC%A3%BC%EC%8B%9C%20%EC%97%B0%EB%8F%99");
  assert.equal(naverUrl, "https://map.naver.com/p/search/Olive%20Young%20Jeju%20%EC%A0%9C%EC%A3%BC%EC%8B%9C%20%EC%97%B0%EB%8F%99");
});

test("moves a place only within its own itinerary day and rewrites day sort order", () => {
  const places = [
    { id: "a", dayId: "d1", sortOrder: 1 },
    { id: "b", dayId: "d1", sortOrder: 2 },
    { id: "c", dayId: "d1", sortOrder: 3 },
    { id: "x", dayId: "d2", sortOrder: 1 },
  ];

  const movedUp = movePlaceWithinDay(places, "c", "up");
  assert.deepEqual(
    movedUp.filter((place) => place.dayId === "d1").map((place) => [place.id, place.sortOrder]),
    [["a", 1], ["c", 2], ["b", 3]],
  );
  assert.deepEqual(
    movedUp.filter((place) => place.dayId === "d2").map((place) => [place.id, place.sortOrder]),
    [["x", 1]],
  );

  const movedDown = movePlaceWithinDay(movedUp, "a", "down");
  assert.deepEqual(
    movedDown.filter((place) => place.dayId === "d1").map((place) => [place.id, place.sortOrder]),
    [["c", 1], ["a", 2], ["b", 3]],
  );
});
