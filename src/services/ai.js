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
  const key = getAiKey();
  if (!key) {
    await pause(450);
    return "\u5c1a\u672a\u8a2d\u5b9a AI API Key\u3002";
  }

  const dataUrl = await fileToDataUrl(file);
  const base64 = dataUrl.split(",")[1];
  const json = await callGemini(key, {
    contents: [
      {
        parts: [
          { text: "Translate all visible image text into Traditional Chinese. Return concise plain text." },
          { inlineData: { mimeType: file.type || "image/jpeg", data: base64 } },
        ],
      },
    ],
  });

  return extractGeminiText(json) || "No translatable text was detected.";
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
