export function formatCurrency(amount, currency = "TWD") {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "TWD" || currency === "JPY" || currency === "KRW" ? 0 : 2,
  }).format(Number(amount || 0));
}

