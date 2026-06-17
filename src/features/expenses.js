import { normalizeExpenseCategory } from "./expense-categories.js";

export function convertToBaseAmount(amount, exchangeRate) {
  return Math.round(Number(amount || 0) * Number(exchangeRate || 1) * 100) / 100;
}

export function convertFromBaseAmount(amount, exchangeRate) {
  const rate = Number(exchangeRate || 1);
  if (!Number.isFinite(rate) || rate <= 0) return Math.round(Number(amount || 0) * 100) / 100;
  return Math.round((Number(amount || 0) / rate) * 100) / 100;
}

export function createExpenseFromReceiptItem(item, options) {
  const totalBase = convertToBaseAmount(item.subtotal, options.exchangeRate);

  return {
    id: crypto.randomUUID(),
    receiptBatchId: options.receiptBatchId,
    source: "ocr",
    originalName: item.originalName,
    translatedName: item.translatedName,
    category: normalizeExpenseCategory(item.category || "\u8cfc\u7269"),
    quantity: Number(item.quantity || 1),
    unitPriceOriginal: Number(item.unitPrice || 0),
    totalOriginal: Number(item.subtotal || 0),
    currency: options.currency,
    exchangeRate: Number(options.exchangeRate || 1),
    totalBase,
    payerId: options.payerId,
    participantIds: [...options.participantIds],
    splitMode: options.splitMode || "equal",
    splitValues: options.splitValues || {},
    expenseDate: options.expenseDate || new Date().toISOString().slice(0, 10),
    receiptPhotoUrl: options.receiptPhotoUrl || "",
    receiptPhotoPath: options.receiptPhotoPath || "",
    receiptPhotoProvider: options.receiptPhotoProvider || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
