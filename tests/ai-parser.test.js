import test from "node:test";
import assert from "node:assert/strict";

import { buildReceiptPrompt, parseGeminiReceiptText } from "../src/services/ai.js";

test("builds a strict receipt prompt that excludes receipt summary rows", () => {
  const prompt = buildReceiptPrompt("KRW");

  assert.match(prompt, /strict JSON/);
  assert.match(prompt, /translatedNameZhTw/);
  assert.match(prompt, /KRW/);
  assert.match(prompt, /Do not return VAT/);
  assert.match(prompt, /final amount actually paid/);
});

test("parses Gemini receipt JSON from fenced or wrapped text", () => {
  const receipt = parseGeminiReceiptText(`
    \`\`\`json
    {
      "receipt": {
        "merchantName": "Olive Young",
        "currency": "KRW",
        "items": [
          { "name": "Mask pack", "nameZhTw": "\\u9762\\u819c", "price": 2500, "qty": 2 }
        ]
      }
    }
    \`\`\`
  `, "KRW");

  assert.equal(receipt.merchantName, "Olive Young");
  assert.equal(receipt.total, 5000);
  assert.equal(receipt.items[0].originalName, "Mask pack");
  assert.equal(receipt.items[0].translatedName, "\u9762\u819c");
});

test("filters tax, coupon, and refund rows while keeping final paid total", () => {
  const receipt = parseGeminiReceiptText(JSON.stringify({
    merchantName: "Olive Young",
    currency: "KRW",
    total: 71630,
    items: [
      { originalName: "Double cut diet mix", translatedNameZhTw: "\u96d9\u6548\u7e96\u9ad4\u679c\u51cd", unitPrice: 22900, quantity: 1, subtotal: 18900, category: "\u8cfc\u7269" },
      { originalName: "VAT", translatedNameZhTw: "\u589e\u503c\u7a05", unitPrice: 6967, quantity: 1, subtotal: 6967, category: "\u5176\u4ed6" },
      { originalName: "Coupon", translatedNameZhTw: "\u512a\u60e0\u5238", unitPrice: -4030, quantity: 1, subtotal: -4030, category: "\u5176\u4ed6" },
      { originalName: "Tax refund", translatedNameZhTw: "\u9000\u7a05", unitPrice: -5000, quantity: 1, subtotal: -5000, category: "\u5176\u4ed6" },
    ],
  }), "KRW");

  assert.equal(receipt.total, 71630);
  assert.equal(receipt.items.length, 1);
  assert.equal(receipt.items[0].translatedName, "\u96d9\u6548\u7e96\u9ad4\u679c\u51cd");
});

test("allocates receipt discounts and refunds across purchased items", () => {
  const receipt = parseGeminiReceiptText(JSON.stringify({
    merchantName: "Olive Young",
    currency: "KRW",
    total: 71630,
    items: [
      { originalName: "A", translatedNameZhTw: "A", unitPrice: 18900, quantity: 1, subtotal: 18900, category: "\u8cfc\u7269" },
      { originalName: "B", translatedNameZhTw: "B", unitPrice: 13900, quantity: 1, subtotal: 13900, category: "\u7f8e\u5bb9" },
      { originalName: "C", translatedNameZhTw: "C", unitPrice: 29900, quantity: 1, subtotal: 29900, category: "\u65e5\u7528\u54c1" },
      { originalName: "D", translatedNameZhTw: "D", unitPrice: 17960, quantity: 1, subtotal: 17960, category: "\u7f8e\u5bb9" },
    ],
  }), "KRW");

  const itemTotal = receipt.items.reduce((sum, item) => sum + item.subtotal, 0);
  assert.equal(itemTotal, 71630);
  assert.equal(receipt.items[0].printedSubtotal, 18900);
});

test("throws a readable error for invalid Gemini receipt output", () => {
  assert.throws(
    () => parseGeminiReceiptText("not json", "KRW"),
    /format that could not be parsed/,
  );
});
