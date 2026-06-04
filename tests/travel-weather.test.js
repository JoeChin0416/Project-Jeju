import test from "node:test";
import assert from "node:assert/strict";

import {
  buildTravelAdvice,
  getDailyWeather,
  getDepartureReminder,
  normalizeForecastResponse,
} from "../src/features/travel-weather.js";

test("normalizes Open-Meteo daily forecast into itinerary weather", () => {
  const forecast = normalizeForecastResponse({
    timezone: "Asia/Seoul",
    daily: {
      time: ["2026-06-21"],
      weather_code: [61],
      temperature_2m_max: [27],
      temperature_2m_min: [22],
      precipitation_probability_max: [70],
      wind_speed_10m_max: [34],
    },
  });

  assert.equal(forecast["2026-06-21"].condition, "陣雨");
  assert.equal(forecast["2026-06-21"].temperature, "22–27°C");
  assert.equal(forecast["2026-06-21"].rainChance, "70%");
  assert.equal(forecast["2026-06-21"].windSpeed, "34 km/h");
  assert.match(forecast["2026-06-21"].outfitAdvice, /雨傘/);
  assert.match(forecast["2026-06-21"].outfitAdvice, /防風/);
});

test("builds practical clothing advice from temperature rain and wind", () => {
  const advice = buildTravelAdvice({
    temperatureMax: 18,
    temperatureMin: 11,
    rainChance: 20,
    windSpeed: 15,
  });

  assert.match(advice, /外套/);
  assert.doesNotMatch(advice, /雨傘/);
});

test("shows an in-app departure reminder one day before the trip", () => {
  const reminder = getDepartureReminder(
    { startDate: "2026-06-21", destination: "濟州島" },
    { "2026-06-21": { condition: "陣雨", outfitAdvice: "攜帶雨傘。" } },
    "2026-06-20",
  );

  assert.equal(reminder.visible, true);
  assert.match(reminder.message, /明天出發/);
  assert.match(reminder.message, /雨傘/);
  assert.equal(getDepartureReminder({ startDate: "2026-06-21" }, {}, "2026-06-19").visible, false);
});

test("uses live weather when available and clearly marks unavailable forecasts", () => {
  const live = getDailyWeather(
    { date: "2026-06-21" },
    0,
    { "2026-06-21": { condition: "晴時多雲", temperature: "23–29°C", rainChance: "20%" } },
  );
  const unavailable = getDailyWeather({ date: "2026-07-20" }, 0, {});

  assert.equal(live.condition, "晴時多雲");
  assert.equal(live.available, true);
  assert.equal(unavailable.available, false);
  assert.equal(unavailable.condition, "預報尚未開放");
});
