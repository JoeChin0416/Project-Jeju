import test from "node:test";
import assert from "node:assert/strict";

import {
  buildGoogleMapsSearchUrl,
  buildMapProviderUrls,
  buildNaverMapSearchUrl,
  movePlaceWithinDay,
} from "../src/features/itinerary.js";

test("builds Google and Naver map search urls from the actual place text", () => {
  const googleUrl = buildGoogleMapsSearchUrl("Olive Young Jeju", "제주시 연동");
  const naverUrl = buildNaverMapSearchUrl("Olive Young Jeju", "제주시 연동");

  assert.equal(googleUrl, "https://www.google.com/maps/search/?api=1&query=Olive%20Young%20Jeju%20%EC%A0%9C%EC%A3%BC%EC%8B%9C%20%EC%97%B0%EB%8F%99");
  assert.equal(naverUrl, "https://map.naver.com/p/search/Olive%20Young%20Jeju%20%EC%A0%9C%EC%A3%BC%EC%8B%9C%20%EC%97%B0%EB%8F%99");
});

test("prefers provider-specific map text and direct Naver links", () => {
  const airbnb = {
    name: "濟州 Airbnb 住宿",
    address: "152-11 Gwangnyeongpyeonghwa 2-gil, Aewol-eup, Jeju-si",
    googleMapQuery: "152-11 Gwangnyeongpyeonghwa 2-gil, Aewol-eup, Jeju-si",
    naverMapQuery: "제주특별자치도 제주시 애월읍 광령평화2길 152-11 118동",
    naverMapUrl: "https://map.naver.com/p/search/%EC%95%A0%EC%9B%94%EB%B0%A4%ED%95%98%EB%8A%98%EB%B0%94%EB%8B%A4%EC%9E%90%EC%97%B0%EC%95%A0",
  };

  const urls = buildMapProviderUrls(airbnb, ["濟州 Airbnb 住宿", "152-11 Gwangnyeongpyeonghwa 2-gil"]);

  assert.equal(urls.naver, airbnb.naverMapUrl);
  assert.equal(urls.google, "https://www.google.com/maps/search/?api=1&query=152-11%20Gwangnyeongpyeonghwa%202-gil%2C%20Aewol-eup%2C%20Jeju-si");
});

test("uses Korean Naver query before fallback display names", () => {
  const urls = buildMapProviderUrls({
    name: "Olive Young",
    address: "Jeju-si",
    naverMapQuery: "올리브영 제주탑동점",
  });

  assert.equal(urls.naver, "https://map.naver.com/p/search/%EC%98%AC%EB%A6%AC%EB%B8%8C%EC%98%81%20%EC%A0%9C%EC%A3%BC%ED%83%91%EB%8F%99%EC%A0%90");
});

test("uses address before Chinese display text for Naver fallback searches", () => {
  const urls = buildMapProviderUrls({
    name: "濟州 Airbnb 住宿",
    address: "제주특별자치도 제주시 애월읍 광령평화2길 152-11 118동",
  }, ["濟州 Airbnb 住宿", "제주특별자치도 제주시 애월읍 광령평화2길 152-11 118동"]);

  const decoded = decodeURIComponent(urls.naver);
  assert.match(decoded, /광령평화2길 152-11/);
  assert.doesNotMatch(decoded, /濟州 Airbnb/);
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
