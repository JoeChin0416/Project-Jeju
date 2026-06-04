import test from "node:test";
import assert from "node:assert/strict";

import { fetchTripWeather } from "../src/services/weather.js";

test("geocodes the destination then requests an Open-Meteo daily forecast", async () => {
  const requests = [];
  const fetchImpl = async (url) => {
    requests.push(String(url));
    if (String(url).includes("geocoding-api")) {
      return response({ results: [{ name: "Jeju", latitude: 33.5, longitude: 126.53, timezone: "Asia/Seoul" }] });
    }
    return response({
      timezone: "Asia/Seoul",
      daily: {
        time: ["2026-06-21"],
        weather_code: [2],
        temperature_2m_max: [28],
        temperature_2m_min: [22],
        precipitation_probability_max: [20],
        wind_speed_10m_max: [18],
      },
    });
  };

  const result = await fetchTripWeather({ destination: "濟州島" }, { fetchImpl });

  assert.equal(result.location.name, "Jeju");
  assert.equal(result.byDate["2026-06-21"].condition, "晴時多雲");
  assert.match(requests[0], /geocoding-api\.open-meteo\.com/);
  assert.match(requests[1], /api\.open-meteo\.com\/v1\/forecast/);
  assert.match(requests[1], /precipitation_probability_max/);
  assert.match(requests[1], /wind_speed_10m_max/);
});

test("uses Jeju coordinates when destination geocoding has no result", async () => {
  const fetchImpl = async (url) => {
    if (String(url).includes("geocoding-api")) return response({ results: [] });
    assert.match(String(url), /latitude=33\.4996/);
    return response({ daily: { time: [] } });
  };

  const result = await fetchTripWeather({ destination: "Jeju Island" }, { fetchImpl });
  assert.equal(result.location.name, "Jeju");
});

function response(body) {
  return {
    ok: true,
    async json() {
      return body;
    },
  };
}
