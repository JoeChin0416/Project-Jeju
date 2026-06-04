const WEATHER_LABELS = new Map([
  [0, "晴朗"],
  [1, "大致晴朗"],
  [2, "晴時多雲"],
  [3, "多雲"],
  [45, "有霧"],
  [48, "霧淞"],
  [51, "毛毛雨"],
  [53, "毛毛雨"],
  [55, "較強毛毛雨"],
  [56, "凍毛毛雨"],
  [57, "較強凍毛毛雨"],
  [61, "陣雨"],
  [63, "中雨"],
  [65, "大雨"],
  [66, "凍雨"],
  [67, "較強凍雨"],
  [71, "小雪"],
  [73, "中雪"],
  [75, "大雪"],
  [77, "霰"],
  [80, "短暫陣雨"],
  [81, "陣雨"],
  [82, "強陣雨"],
  [85, "短暫陣雪"],
  [86, "強陣雪"],
  [95, "雷雨"],
  [96, "雷雨伴冰雹"],
  [99, "強雷雨伴冰雹"],
]);

export function normalizeForecastResponse(payload = {}) {
  const daily = payload.daily || {};
  const dates = daily.time || [];

  return Object.fromEntries(dates.map((date, index) => {
    const temperatureMax = numberAt(daily.temperature_2m_max, index);
    const temperatureMin = numberAt(daily.temperature_2m_min, index);
    const rainChance = numberAt(daily.precipitation_probability_max, index);
    const windSpeed = numberAt(daily.wind_speed_10m_max, index);
    const weatherCode = numberAt(daily.weather_code, index);

    return [date, {
      available: true,
      source: "Open-Meteo",
      timezone: payload.timezone || "",
      weatherCode,
      condition: weatherCodeLabel(weatherCode),
      temperature: formatTemperatureRange(temperatureMin, temperatureMax),
      temperatureMin,
      temperatureMax,
      rainChance: `${Math.round(rainChance || 0)}%`,
      rainChanceValue: rainChance || 0,
      windSpeed: `${Math.round(windSpeed || 0)} km/h`,
      windSpeedValue: windSpeed || 0,
      outfitAdvice: buildTravelAdvice({ temperatureMax, temperatureMin, rainChance, windSpeed }),
    }];
  }));
}

export function buildTravelAdvice({ temperatureMax = 0, temperatureMin = 0, rainChance = 0, windSpeed = 0 } = {}) {
  const advice = [];

  if (temperatureMin <= 12) advice.push("洋蔥式穿搭並帶保暖外套");
  else if (temperatureMin <= 18) advice.push("薄長袖搭輕便外套");
  else if (temperatureMax >= 28) advice.push("透氣短袖或薄裙，記得防曬");
  else advice.push("短袖搭薄外套");

  if (rainChance >= 60) advice.push("攜帶雨傘與防水鞋");
  else if (rainChance >= 30) advice.push("包包放一把輕便雨傘");

  if (windSpeed >= 30) advice.push("海邊風強，準備防風外套");

  return `${advice.join("，")}。`;
}

export function getDepartureReminder(trip = {}, weatherByDate = {}, today = todayString()) {
  if (!trip.startDate || differenceInDays(today, trip.startDate) !== 1) return { visible: false, message: "" };
  const weather = weatherByDate[trip.startDate];
  const weatherText = weather
    ? `預計${weather.condition}，${weather.outfitAdvice}`
    : "目前尚未取得出發日預報，記得出發前再次確認天氣。";
  return {
    visible: true,
    message: `明天出發前往${trip.destination || "目的地"}。${weatherText}`,
  };
}

export function getDailyWeather(day = {}, dayIndex = 0, weatherByDate = {}) {
  const live = weatherByDate?.[day.date];
  if (live) return { available: true, ...live };

  const custom = day.weather;
  if (custom?.condition) {
    return {
      available: true,
      source: "manual",
      windSpeed: custom.windSpeed || "",
      ...custom,
    };
  }

  return {
    available: false,
    source: "",
    condition: "預報尚未開放",
    temperature: "等待即時預報",
    rainChance: "待更新",
    windSpeed: "待更新",
    outfitAdvice: dayIndex === 0
      ? "天氣 API 取得最新預報後，會自動產生穿搭與雨具提醒。"
      : "接近旅行日期時會自動更新穿搭與雨具提醒。",
  };
}

export function weatherCodeLabel(code) {
  return WEATHER_LABELS.get(Number(code)) || "天氣變化";
}

function formatTemperatureRange(min, max) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return "待更新";
  return `${Math.round(min)}–${Math.round(max)}°C`;
}

function numberAt(values, index) {
  const value = Number(values?.[index]);
  return Number.isFinite(value) ? value : 0;
}

function differenceInDays(fromDate, toDate) {
  const from = Date.parse(`${fromDate}T00:00:00Z`);
  const to = Date.parse(`${toDate}T00:00:00Z`);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return Number.NaN;
  return Math.round((to - from) / 86_400_000);
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}
