const FRANKFURTER_RATES_URL = "https://api.frankfurter.dev/v2/rates";

export async function fetchLatestExchangeRate(baseCurrency = "KRW", quoteCurrency = "TWD", fetchImpl = fetch) {
  const base = normalizeCurrencyCode(baseCurrency);
  const quote = normalizeCurrencyCode(quoteCurrency);
  const url = `${FRANKFURTER_RATES_URL}?base=${encodeURIComponent(base)}&quotes=${encodeURIComponent(quote)}`;
  const response = await fetchImpl(url);
  if (!response.ok) throw new Error(`匯率查詢失敗 (${response.status})`);
  const payload = await response.json();
  return {
    baseCurrency: base,
    quoteCurrency: quote,
    rate: parseFrankfurterRateResponse(payload, quote),
    date: parseFrankfurterRateDate(payload),
  };
}

export function parseFrankfurterRateResponse(payload, quoteCurrency = "TWD") {
  const quote = normalizeCurrencyCode(quoteCurrency);
  const rawRate = Array.isArray(payload)
    ? payload.find((entry) => normalizeCurrencyCode(entry?.quote) === quote)?.rate
    : payload?.rates?.[quote];
  const rate = Number(rawRate);
  if (!Number.isFinite(rate) || rate <= 0) throw new Error("匯率回傳格式無法辨識");
  return Math.round(rate * 100000) / 100000;
}

function parseFrankfurterRateDate(payload) {
  if (Array.isArray(payload)) return payload.find((entry) => entry?.date)?.date || "";
  return payload?.date || "";
}

function normalizeCurrencyCode(currency) {
  return String(currency || "").trim().toUpperCase();
}
