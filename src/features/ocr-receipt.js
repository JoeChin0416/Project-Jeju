import { normalizeExpenseCategory } from "./expense-categories.js";

const FALLBACK_CATEGORY = "\u8cfc\u7269";
const NOISE_TEXT_PATTERN = new RegExp([
  "tax",
  "vat",
  "coupon",
  "discount",
  "refund",
  "\\ubd80\\uac00\\uc138",
  "\\ucfe0\\ud3f0",
  "\\ud560\\uc778",
  "\\ud0dd\\uc2a4\\ub9ac\\ud380\\ub4dc",
  "\\ud310\\ub9e4\\uacc4",
  "\\uacb0\\uc81c\\uae08\\uc561",
  "\\uc2e0\\uc6a9\\uce74\\ub4dc",
  "\\uacfc\\uc138",
  "\\ud569\\uacc4",
  "\\u6298\\u6263",
  "\\u512a\\u60e0\\u5238",
  "\\u9000\\u7a05",
  "\\u589e\\u503c\\u7a05",
  "\\u7a05\\u984d",
  "\\u7e3d\\u8a08",
  "\\u61c9\\u4ed8",
  "\\u5be6\\u4ed8",
].join("|"), "i");

export function normalizeReceiptResult(source = {}, fallbackCurrency = "KRW") {
  const receipt = source.receipt || source;
  const rawItems = (receipt.items || []).map(normalizeReceiptItem).filter(isPurchasableItem);
  const total = Number(
    receipt.amountPaid ??
    receipt.paidTotal ??
    receipt.finalPaid ??
    receipt.actualPaid ??
    receipt.total ??
    calculateTotal(rawItems),
  );
  const items = distributeTotalAcrossItems(rawItems, total);

  return {
    id: crypto.randomUUID(),
    merchantName: String(receipt.merchantName || "\u672a\u8fa8\u8b58\u5e97\u5bb6"),
    receiptDate: String(receipt.receiptDate || new Date().toISOString().slice(0, 10)),
    currency: String(receipt.currency || fallbackCurrency),
    total,
    items,
    isDemo: Boolean(receipt.isDemo),
    photoUrl: receipt.photoUrl || "",
    photoPath: receipt.photoPath || "",
    photoProvider: receipt.photoProvider || "",
    createdAt: new Date().toISOString(),
  };
}

export function createDemoReceipt() {
  return normalizeReceiptResult({
    merchantName: "Demo Market",
    currency: "KRW",
    isDemo: true,
    items: [
      { originalName: "Orange chocolate", translatedNameZhTw: "\u6a58\u5b50\u5de7\u514b\u529b", unitPrice: 3500, quantity: 1, category: FALLBACK_CATEGORY },
      { originalName: "Water", translatedNameZhTw: "\u7926\u6cc9\u6c34", unitPrice: 1200, quantity: 2, category: "\u65e5\u7528\u54c1" },
      { originalName: "Gimbap", translatedNameZhTw: "\u7d2b\u83dc\u98ef\u6372", unitPrice: 4200, quantity: 1, category: "\u9910\u98f2" },
    ],
  });
}

function normalizeReceiptItem(item = {}) {
  const unitPrice = Number(item.unitPrice ?? item.price ?? 0);
  const quantity = Number(item.quantity ?? item.qty ?? 1);
  const subtotal = Number(item.subtotal ?? item.amount ?? unitPrice * quantity);

  return {
    id: crypto.randomUUID(),
    originalName: String(item.originalName || item.name || ""),
    translatedName: String(item.translatedName || item.translatedNameZhTw || item.nameZhTw || item.name || "\u672a\u8fa8\u8b58\u54c1\u9805"),
    category: normalizeExpenseCategory(item.category || FALLBACK_CATEGORY),
    unitPrice,
    quantity,
    subtotal,
  };
}

function isPurchasableItem(item) {
  if (!item) return false;
  if (Number(item.subtotal || 0) <= 0) return false;
  const text = `${item.originalName || ""} ${item.translatedName || ""} ${item.category || ""}`;
  return !NOISE_TEXT_PATTERN.test(text);
}

function calculateTotal(items) {
  return items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
}

function distributeTotalAcrossItems(items, total) {
  const itemTotal = calculateTotal(items);
  if (!items.length || !Number.isFinite(total) || total <= 0 || itemTotal <= 0 || Math.abs(itemTotal - total) < 0.01) {
    return items;
  }

  let allocated = 0;
  return items.map((item, index) => {
    const subtotal = index === items.length - 1
      ? roundMoney(total - allocated)
      : roundMoney((Number(item.subtotal || 0) / itemTotal) * total);
    allocated = roundMoney(allocated + subtotal);
    return {
      ...item,
      printedSubtotal: item.subtotal,
      subtotal,
      unitPrice: roundMoney(subtotal / Number(item.quantity || 1)),
    };
  });
}

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}
