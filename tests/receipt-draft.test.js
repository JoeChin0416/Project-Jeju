import test from "node:test";
import assert from "node:assert/strict";

import { createExpenseFromReceiptItem } from "../src/features/expenses.js";
import { normalizeReceiptResult } from "../src/features/ocr-receipt.js";
import {
  calculateReceiptTotal,
  createBlankReceiptItem,
  updateReceiptDraftItem,
  updateReceiptDraftMeta,
} from "../src/features/receipt-draft.js";

test("normalizes OCR receipt data with Traditional Chinese defaults", () => {
  const receipt = normalizeReceiptResult(
    {
      currency: "KRW",
      items: [
        {
          originalName: "Olive Young Mask",
          translatedNameZhTw: "Olive Young \u9762\u819c",
          unitPrice: 2500,
          quantity: 3,
        },
      ],
    },
    "JPY",
  );

  assert.equal(receipt.merchantName, "\u672a\u8fa8\u8b58\u5e97\u5bb6");
  assert.equal(receipt.currency, "KRW");
  assert.equal(receipt.total, 7500);
  assert.equal(receipt.items[0].translatedName, "Olive Young \u9762\u819c");
  assert.equal(receipt.items[0].category, "\u8cfc\u7269");
});

test("updates receipt item amount fields and recalculates totals", () => {
  const draft = {
    merchantName: "Olive Young",
    receiptDate: "2026-06-22",
    currency: "KRW",
    total: 1000,
    items: [
      {
        id: "item-1",
        originalName: "Mask",
        translatedName: "\u9762\u819c",
        category: "\u8cfc\u7269",
        unitPrice: 1000,
        quantity: 1,
        subtotal: 1000,
      },
    ],
  };

  const updated = updateReceiptDraftItem(draft, "item-1", "quantity", "4");

  assert.equal(updated.items[0].quantity, 4);
  assert.equal(updated.items[0].subtotal, 4000);
  assert.equal(updated.total, 4000);
  assert.notEqual(updated, draft);
});

test("allows receipt meta editing and blank row creation", () => {
  const draft = updateReceiptDraftMeta({ total: 0, items: [] }, "merchantName", "Dongmun Market");
  const item = createBlankReceiptItem();

  assert.equal(draft.merchantName, "Dongmun Market");
  assert.equal(item.category, "\u8cfc\u7269");
  assert.equal(item.quantity, 1);
  assert.equal(calculateReceiptTotal([{ subtotal: 10.125 }, { subtotal: 4.115 }]), 14.24);
});

test("creates accounting entries from edited receipt items", () => {
  const expense = createExpenseFromReceiptItem(
    {
      originalName: "Orange chocolate",
      translatedName: "\u6a58\u5b50\u5de7\u514b\u529b",
      unitPrice: 8900,
      quantity: 2,
      subtotal: 17800,
    },
    {
      receiptBatchId: "batch-1",
      currency: "KRW",
      exchangeRate: 0.024,
      payerId: "member-a",
      participantIds: ["member-a", "member-b"],
      splitMode: "equal",
      receiptPhotoUrl: "https://storage.example/receipt.jpg",
      receiptPhotoPath: "receipts/batch-1.jpg",
      receiptPhotoProvider: "firebase-storage",
    },
  );

  assert.equal(expense.category, "\u8cfc\u7269");
  assert.equal(expense.totalOriginal, 17800);
  assert.equal(expense.totalBase, 427.2);
  assert.equal(expense.receiptPhotoUrl, "https://storage.example/receipt.jpg");
  assert.equal(expense.receiptPhotoPath, "receipts/batch-1.jpg");
  assert.equal(expense.receiptPhotoProvider, "firebase-storage");
  assert.deepEqual(expense.participantIds, ["member-a", "member-b"]);
});
