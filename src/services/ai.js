import { createDemoReceipt, normalizeReceiptResult } from "../features/ocr-receipt.js";

const AI_KEY_STORAGE = "project-jeju.ai-key";
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export function getAiKey() {
  return localStorage.getItem(AI_KEY_STORAGE) || "";
}

export function setAiKey(value) {
  localStorage.setItem(AI_KEY_STORAGE, value.trim());
}

export function clearAiKey() {
  localStorage.removeItem(AI_KEY_STORAGE);
}

export async function testAiKey() {
  const key = getAiKey();
  if (!key) throw new Error("\u5c1a\u672a\u8a2d\u5b9a AI API Key\u3002");
  return true;
}

export async function recognizeReceiptImage(file, trip) {
  const key = getAiKey();
  if (!key) {
    await pause(550);
    return createDemoReceipt();
  }

  const dataUrl = await fileToDataUrl(file);
  const base64 = dataUrl.split(",")[1];
  const prompt = buildReceiptPrompt(trip?.tripCurrency || "KRW");
  const json = await callGemini(key, {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: file.type || "image/jpeg",
              data: base64,
            },
          },
        ],
      },
    ],
    generationConfig: { responseMimeType: "application/json" },
  });

  const text = extractGeminiText(json);
  if (!text) throw new Error("AI did not return parseable receipt content. Please try a clearer photo.");
  return parseGeminiReceiptText(text, trip?.tripCurrency || "KRW");
}

export async function translateImage(file) {
  const layout = await translateImageLayout(file);
  if (layout.translations?.length) {
    return layout.translations.map((entry) => entry.translatedText).join("\n");
  }
  return layout.summary || "No translatable text was detected.";
}

export async function translateImageLayout(file) {
  const key = getAiKey();
  if (!key) {
    await pause(450);
    return {
      summary: "\u5c1a\u672a\u8a2d\u5b9a AI API Key\u3002",
      translations: [],
    };
  }

  const dataUrl = await fileToDataUrl(file);
  const base64 = dataUrl.split(",")[1];
  const json = await callGemini(key, {
    contents: [
      {
        parts: [
          { text: buildTranslationLayoutPrompt() },
          { inlineData: { mimeType: file.type || "image/jpeg", data: base64 } },
        ],
      },
    ],
    generationConfig: { responseMimeType: "application/json" },
  });

  return parseGeminiTranslationLayoutText(extractGeminiText(json) || "{}");
}

export function buildReceiptPrompt(defaultCurrency = "KRW") {
  return [
    "You are a precise receipt OCR parser for a travel expense web app.",
    "Return strict JSON only. Do not include Markdown, comments, explanations, or extra text.",
    `If currency is unclear, use ${defaultCurrency}.`,
    "Read only purchased product line items. Translate item names into Traditional Chinese.",
    "Do not return VAT, tax, taxable subtotal, coupon, discount, tax refund, payment method, sale total, card total, greeting lines, barcode lines, or receipt summary rows as items.",
    "For Korean receipts, ignore rows such as 부가세, 과세 합계, 판매계, 실물쿠폰, 택스리펀드, 신용카드, 결제금액 unless using them to determine the final paid amount.",
    "Set total to the final amount actually paid by the customer after coupons, discounts, and tax refund. Prefer the card/cash paid row such as 신용카드 when present.",
    "Use numbers only for price fields. Do not include currency symbols or commas.",
    "Required JSON schema:",
    "{",
    '  "merchantName": "string, store name or 未辨識店家",',
    '  "receiptDate": "YYYY-MM-DD or empty string",',
    '  "currency": "ISO currency such as KRW, JPY, TWD, USD",',
    '  "total": 71630,',
    '  "items": [',
    '    { "originalName": "string", "translatedNameZhTw": "繁體中文品項", "unitPrice": 123, "quantity": 1, "subtotal": 123, "category": "住宿|交通|餐飲|日用品|美容|娛樂|購物|其他" }',
    "  ]",
    "}",
    "If an item amount differs from unitPrice times quantity because of item-level sale pricing, use the printed amount as subtotal.",
  ].join("\n");
}

export function parseGeminiReceiptText(text, fallbackCurrency = "KRW") {
  try {
    const parsed = JSON.parse(extractJsonText(text));
    return normalizeReceiptResult(parsed.receipt || parsed, fallbackCurrency);
  } catch {
    throw new Error("AI returned a format that could not be parsed. Please edit the receipt manually or retry with a clearer photo.");
  }
}

export function parseGeminiTranslationLayoutText(text) {
  const parsed = JSON.parse(extractJsonText(text));
  const translations = Array.isArray(parsed.translations) ? parsed.translations : [];
  return {
    summary: String(parsed.summary || parsed.title || "").trim(),
    translations: translations
      .map(normalizeTranslationEntry)
      .filter((entry) => entry.translatedText && entry.box.width > 0 && entry.box.height > 0),
  };
}

function buildTranslationLayoutPrompt() {
  return [
    "You are an image text translator for a travel mobile web app.",
    "Return strict JSON only. Do not include Markdown or explanations.",
    "Translate visible text into Traditional Chinese.",
    "Preserve the spatial layout by returning one bounding box for each translated text block.",
    "Use normalized image coordinates from 0 to 1000 for x, y, width, and height.",
    "Group nearby words into useful blocks such as menu item, sign label, warning line, or price row.",
    "If a box is uncertain, approximate it; keep it near the original text position.",
    "Required JSON schema:",
    "{",
    '  "summary": "short Traditional Chinese summary",',
    '  "translations": [',
    '    { "originalText": "source text", "translatedTextZhTw": "繁體中文", "box": { "x": 0, "y": 0, "width": 100, "height": 40 } }',
    "  ]",
    "}",
  ].join("\n");
}

function normalizeTranslationEntry(entry) {
  const box = entry?.box || entry || {};
  return {
    originalText: String(entry?.originalText || entry?.sourceText || "").trim(),
    translatedText: String(entry?.translatedTextZhTw || entry?.translatedText || entry?.zhTw || "").trim(),
    box: {
      x: clampLayoutNumber(box.x),
      y: clampLayoutNumber(box.y),
      width: clampLayoutNumber(box.width),
      height: clampLayoutNumber(box.height),
    },
  };
}

function clampLayoutNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(1000, Math.round(number)));
}

async function callGemini(key, body) {
  const response = await fetch(GEMINI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": key,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const message = await parseGeminiError(response);
    throw new Error(`AI OCR failed (${response.status}): ${message}`);
  }

  return response.json();
}

async function parseGeminiError(response) {
  const text = await response.text().catch(() => "");
  if (!text) return "Google Gemini returned no error details.";

  try {
    const json = JSON.parse(text);
    return json.error?.message || text.slice(0, 240);
  } catch {
    return text.slice(0, 240);
  }
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function pause(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractGeminiText(responseJson) {
  return responseJson.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();
}

function extractJsonText(text) {
  const trimmed = String(text || "").trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim();
  const candidate = fenced || trimmed;
  if (candidate.startsWith("{") && candidate.endsWith("}")) return candidate;

  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start >= 0 && end > start) return candidate.slice(start, end + 1);
  return candidate;
}
