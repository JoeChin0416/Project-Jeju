import { normalizeForecastResponse } from "../features/travel-weather.js";

const JEJU_LOCATION = {
  name: "Jeju",
  latitude: 33.4996,
  longitude: 126.5312,
  timezone: "Asia/Seoul",
};

export async function fetchTripWeather(trip = {}, options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const location = await resolveWeatherLocation(trip.destination, fetchImpl);
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
      "wind_speed_10m_max",
    ].join(","),
    timezone: location.timezone || "auto",
    forecast_days: "16",
  }).toString();

  const payload = await fetchJson(url, fetchImpl);
  return {
    location,
    byDate: normalizeForecastResponse(payload),
    fetchedAt: new Date().toISOString(),
    source: "Open-Meteo",
  };
}

export async function resolveWeatherLocation(destination, fetchImpl = fetch) {
  const name = String(destination || "").trim();
  if (!name) return JEJU_LOCATION;

  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.search = new URLSearchParams({
    name,
    count: "1",
    language: "zh",
    format: "json",
  }).toString();
  const payload = await fetchJson(url, fetchImpl);
  const result = payload.results?.[0];
  if (!result) {
    if (isJejuDestination(name)) return JEJU_LOCATION;
    throw new Error(`找不到「${name}」的天氣位置`);
  }

  return {
    name: result.name || name,
    latitude: result.latitude,
    longitude: result.longitude,
    timezone: result.timezone || "auto",
  };
}

async function fetchJson(url, fetchImpl) {
  const response = await fetchImpl(url);
  if (!response.ok) throw new Error(`天氣服務暫時無法使用 (${response.status || "network"})`);
  return response.json();
}

function isJejuDestination(value) {
  return /jeju|濟州|제주/i.test(value);
}
