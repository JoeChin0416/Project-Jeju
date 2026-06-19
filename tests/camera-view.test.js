import test from "node:test";
import assert from "node:assert/strict";

test("camera preview image URLs are escaped before rendering", async () => {
  globalThis.localStorage = globalThis.localStorage ?? {
    getItem: () => "",
    setItem: () => {},
    removeItem: () => {},
  };

  const [{ cameraView }, { state }] = await Promise.all([
    import("../src/views/camera-view.js"),
    import("../src/state/app-state.js"),
  ]);

  const trip = { members: [] };
  const maliciousTranslationUrl = `blob:receipt" onerror="alert(1)`;
  state.cameraMode = "translation";
  state.loading = false;
  state.error = "";
  state.notice = "";
  state.ocrDraft = null;
  state.imagePreviewUrl = maliciousTranslationUrl;
  state.translationResult = "translated";
  state.translationLayout = { summary: "translated", translations: [] };

  const translationHtml = cameraView(trip, () => {}).html;
  assert.doesNotMatch(translationHtml, /src="blob:receipt" onerror=/);
  assert.match(translationHtml, /src="blob:receipt&quot; onerror=&quot;alert\(1\)"/);

  const maliciousReceiptUrl = `blob:receipt" onerror="alert(2)`;
  state.cameraMode = "receipt";
  state.imagePreviewUrl = maliciousReceiptUrl;
  state.translationResult = "";
  state.translationLayout = null;
  state.ocrDraft = {
    currency: "KRW",
    isDemo: false,
    merchantName: "",
    receiptDate: "",
    total: 0,
    items: [],
  };

  const receiptHtml = cameraView(trip, () => {}).html;
  assert.doesNotMatch(receiptHtml, /src="blob:receipt" onerror=/);
  assert.match(receiptHtml, /src="blob:receipt&quot; onerror=&quot;alert\(2\)"/);

  state.ocrDraft = null;
  state.imagePreviewUrl = "";
  state.translationResult = "";
  state.translationLayout = null;
});
