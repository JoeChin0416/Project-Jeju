import { EXPENSE_CATEGORIES } from "../features/expense-categories.js?v=20260604-qa-weather-ocr";
import { createExpenseFromReceiptItem } from "../features/expenses.js";
import { calculateReceiptTotal, createBlankReceiptItem, updateReceiptDraftItem, updateReceiptDraftMeta } from "../features/receipt-draft.js?v=20260604-qa-weather-ocr";
import { buildSplitValues } from "../features/split-values.js?v=20260604-qa-weather-ocr";
import { recognizeReceiptImage, translateImageLayout } from "../services/ai.js";
import { uploadReceiptPhoto } from "../services/storage.js?v=20260604-qa-weather-ocr";
import { state } from "../state/app-state.js";
import { updateActiveTrip } from "../state/trip-store.js?v=20260604-qa-weather-ocr";
import { escapeHtml } from "../utils/dom.js";
import { fileToCompressedImage } from "../utils/image.js?v=20260604-qa-weather-ocr";

const T = {
  receipt: "\u6536\u64da",
  translate: "\u7ffb\u8b6f",
  pickPhoto: "\u9078\u64c7\u7167\u7247",
  ocrTitle: "\u62cd\u7167\u8fa8\u8b58\u6536\u64da",
  translateTitle: "\u62cd\u7167\u7ffb\u8b6f\u6587\u5b57",
  ocrHint: "\u8fa8\u8b58\u5f8c\u6703\u5148\u9032\u5165\u78ba\u8a8d\u756b\u9762\uff0c\u54c1\u9805\u8207\u91d1\u984d\u90fd\u53ef\u4ee5\u624b\u52d5\u4fee\u6539\u3002",
  translateHint: "\u4e0a\u50b3\u7167\u7247\u5f8c\u6703\u5c07\u53ef\u898b\u6587\u5b57\u7ffb\u8b6f\u6210\u7e41\u9ad4\u4e2d\u6587\u3002",
  recognizing: "AI \u8fa8\u8b58\u4e2d...",
  resultTitle: "\u7ffb\u8b6f\u7d50\u679c",
  translationOverlayHint: "已保留原圖，中文翻譯會盡量貼在原文位置；若位置不準可參考下方文字清單。",
  noTranslationBoxes: "AI 沒有回傳可定位文字，先顯示純文字翻譯。",
  confirmTitle: "OCR \u8fa8\u8b58\u78ba\u8a8d",
  confirmHint: "\u53ea\u4fdd\u7559\u771f\u6b63\u8cfc\u8cb7\u7684\u54c1\u9805\uff1b\u9000\u7a05\u3001\u512a\u60e0\u5238\u3001\u6298\u6263\u8207 VAT \u4e0d\u6703\u532f\u5165\u6210\u54c1\u9805\u3002",
  demo: "\u5c1a\u672a\u8a2d\u5b9a AI API Key\uff0c\u76ee\u524d\u986f\u793a\u7684\u662f\u793a\u7bc4\u8cc7\u6599\u3002",
  store: "\u5e97\u5bb6",
  date: "\u65e5\u671f",
  payer: "\u4ed8\u6b3e\u4eba",
  participants: "分帳對象",
  splitHint: "匯入後仍可在記帳頁逐筆調整付款人、分帳對象與分帳方式。",
  total: "\u5be6\u4ed8\u7e3d\u984d",
  original: "\u539f\u6587",
  zh: "\u4e2d\u6587",
  category: "\u5206\u985e",
  unitPrice: "\u55ae\u50f9",
  quantity: "\u6578\u91cf",
  subtotal: "\u5c0f\u8a08",
  addItem: "\u65b0\u589e\u54c1\u9805",
  importExpense: "\u532f\u5165\u8a18\u5e33",
  deleteItem: "\u522a\u9664\u54c1\u9805",
  previewAlt: "\u6536\u64da\u9810\u89bd",
  noItems: "\u6c92\u6709\u53ef\u532f\u5165\u7684\u54c1\u9805\u3002",
  imported: "\u6536\u64da\u5df2\u532f\u5165\u8a18\u5e33\u3002",
  failed: "AI \u8fa8\u8b58\u5931\u6557\uff0c\u8acb\u518d\u8a66\u4e00\u6b21\u3002",
};

export function cameraView(trip, render) {
  return {
    html: `
      <section class="panel span-all">
        <div class="segmented">
          <button class="segment ${state.cameraMode === "receipt" ? "is-active" : ""}" data-camera-mode="receipt">${T.receipt}</button>
          <button class="segment ${state.cameraMode === "translation" ? "is-active" : ""}" data-camera-mode="translation">${T.translate}</button>
        </div>
      </section>
      <section class="panel span-all">
        <div class="camera-drop">
          <div>
            ${cameraSvg()}
            <h2>${state.cameraMode === "receipt" ? T.ocrTitle : T.translateTitle}</h2>
            <p>${state.cameraMode === "receipt" ? T.ocrHint : T.translateHint}</p>
            <button class="button coral" type="button" data-pick-image style="margin-top:14px">${T.pickPhoto}</button>
          </div>
        </div>
      </section>
      ${state.loading ? `<section class="panel span-all"><div class="status">${T.recognizing}</div></section>` : ""}
      ${state.ocrDraft ? renderReceiptDraft(trip) : ""}
      ${state.translationResult || state.translationLayout ? renderTranslationResult() : ""}
    `,
    bind(root) {
      root.addEventListener("click", (event) => {
        const mode = event.target.closest("[data-camera-mode]")?.dataset.cameraMode;
        if (mode) {
          state.cameraMode = mode;
          state.ocrDraft = null;
          state.ocrPayerId = "";
          state.ocrParticipantIds = [];
          state.translationResult = "";
          state.translationLayout = null;
          render();
          return;
        }
        if (event.target.closest("[data-pick-image]")) {
          document.querySelector("#image-input").click();
          return;
        }
        if (event.target.closest("[data-add-receipt-row]")) {
          state.ocrDraft.items.push(createBlankReceiptItem());
          state.ocrDraft.total = calculateReceiptTotal(state.ocrDraft.items);
          render();
          return;
        }
        const deleteId = event.target.closest("[data-delete-receipt-row]")?.dataset.deleteReceiptRow;
        if (deleteId) {
          state.ocrDraft.items = state.ocrDraft.items.filter((item) => item.id !== deleteId);
          state.ocrDraft.total = calculateReceiptTotal(state.ocrDraft.items);
          render();
          return;
        }
        if (event.target.closest("[data-import-receipt]")) {
          importReceipt(trip);
          render();
        }
      });

      const updateDraftFromField = (event) => {
        if (!state.ocrDraft) return;
        if (event.target.dataset.ocrPayer) {
          state.ocrPayerId = event.target.value;
          return;
        }
        if (event.target.dataset.ocrParticipant) {
          state.ocrParticipantIds = [...root.querySelectorAll("[data-ocr-participant]:checked")].map((input) => input.value);
          return;
        }
        const metaField = event.target.dataset.receiptMeta;
        if (metaField) {
          state.ocrDraft = updateReceiptDraftMeta(state.ocrDraft, metaField, event.target.value);
          return;
        }
        const field = event.target.dataset.receiptField;
        const id = event.target.dataset.receiptItem;
        if (field && id) state.ocrDraft = updateReceiptDraftItem(state.ocrDraft, id, field, event.target.value);
      };

      root.addEventListener("input", updateDraftFromField);
      root.addEventListener("change", updateDraftFromField);
    },
  };
}

export function bindImageInput(render) {
  const input = document.querySelector("#image-input");
  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file) return;
    state.loading = true;
    state.error = "";
    state.notice = "";
    state.ocrDraft = null;
    state.ocrPayerId = "";
    state.ocrParticipantIds = [];
    state.receiptPhotoDraftUrl = "";
    state.receiptPhotoDraftPath = "";
    state.receiptPhotoDraftProvider = "";
    if (state.imagePreviewUrl) URL.revokeObjectURL(state.imagePreviewUrl);
    state.translationResult = "";
    state.translationLayout = null;
    render();

    let previewUrl = "";
    try {
      const trip = state.store.trips.find((entry) => entry.id === state.store.lastTripId);
      const image = await fileToCompressedImage(file, { maxSize: 1600, quality: 0.78 });
      previewUrl = image.previewUrl;
      state.imagePreviewUrl = previewUrl;
      render();

      const ocrFile = new File([image.blob], image.fileName, { type: image.blob.type || "image/jpeg" });
      if (state.cameraMode === "receipt") {
        const draftId = crypto.randomUUID();
        const uploadPromise = uploadReceiptPhoto(image.blob, {
          tripId: trip.id,
          draftId,
          fileName: image.fileName,
          user: state.user,
        });
        const draft = await recognizeReceiptImage(ocrFile, trip);
        const uploaded = await uploadPromise.catch(() => null);
        state.ocrDraft = {
          ...draft,
          photoUrl: uploaded?.photoUrl || "",
          photoPath: uploaded?.photoPath || "",
          photoProvider: uploaded?.photoProvider || "",
        };
        state.ocrPayerId = trip.members[0]?.id || "";
        state.ocrParticipantIds = trip.members.map((member) => member.id);
        state.receiptPhotoDraftUrl = state.ocrDraft.photoUrl;
        state.receiptPhotoDraftPath = state.ocrDraft.photoPath;
        state.receiptPhotoDraftProvider = state.ocrDraft.photoProvider;
      } else {
        state.translationLayout = await translateImageLayout(ocrFile);
        state.translationResult = translationTextFromLayout(state.translationLayout);
      }
    } catch (error) {
      state.error = error.message || T.failed;
    } finally {
      state.loading = false;
      input.value = "";
      render();
    }
  });
}

function renderTranslationResult() {
  const layout = state.translationLayout || { summary: state.translationResult, translations: [] };
  const translations = layout.translations || [];
  return `
    <section class="panel span-all translation-result-panel">
      <div class="section-title">
        <div><h2>${T.resultTitle}</h2><p>${T.translationOverlayHint}</p></div>
      </div>
      ${state.imagePreviewUrl ? renderTranslationPreview(translations) : ""}
      ${translations.length === 0 ? `<div class="status">${T.noTranslationBoxes}</div>` : ""}
      <div class="translation-text-list">
        ${translations.map((entry) => `
          <article class="translation-text-row">
            <span>${escapeHtml(entry.originalText || "")}</span>
            <strong>${escapeHtml(entry.translatedText)}</strong>
          </article>
        `).join("") || `<p>${escapeHtml(state.translationResult || layout.summary || "")}</p>`}
      </div>
    </section>
  `;
}

function renderTranslationPreview(translations) {
  return `
    <div class="translation-preview">
      <img src="${state.imagePreviewUrl}" alt="${T.resultTitle}" />
      ${translations.map((entry) => {
        const left = entry.box.x / 10;
        const top = entry.box.y / 10;
        const width = Math.max(12, entry.box.width / 10);
        return `
          <span class="translation-overlay-box" style="left:${left}%;top:${top}%;width:${width}%">
            ${escapeHtml(entry.translatedText)}
          </span>
        `;
      }).join("")}
    </div>
  `;
}

function translationTextFromLayout(layout) {
  if (layout?.translations?.length) return layout.translations.map((entry) => entry.translatedText).join("\n");
  return layout?.summary || "";
}

function renderReceiptDraft(trip) {
  const draft = state.ocrDraft;
  const selectedPayerId = state.ocrPayerId || trip.members[0]?.id || "";
  const selectedParticipantIds = state.ocrParticipantIds?.length
    ? state.ocrParticipantIds
    : trip.members.map((member) => member.id);
  return `
    <section class="panel span-all">
      <div class="section-title">
        <div><h2>${T.confirmTitle}</h2><p>${T.confirmHint}</p></div>
        <span class="pill">${escapeHtml(draft.currency)}</span>
      </div>
      ${draft.isDemo ? `<div class="status danger" style="margin-bottom:12px">${T.demo}</div>` : ""}
      ${state.imagePreviewUrl ? `<img class="receipt-preview" src="${state.imagePreviewUrl}" alt="${T.previewAlt}" />` : ""}
      <div class="form-grid">
        <div class="form-row">
          <div class="field"><label>${T.store}</label><input class="input" value="${escapeHtml(draft.merchantName)}" data-receipt-meta="merchantName" /></div>
          <div class="field"><label>${T.date}</label><input class="input" type="date" value="${escapeHtml(draft.receiptDate)}" data-receipt-meta="receiptDate" /></div>
        </div>
        <div class="form-row">
          <div class="field"><label>${T.payer}</label>${memberSelect(trip, "draft-payer", selectedPayerId)}</div>
          <div class="field"><label>${T.total}</label><input class="input" inputmode="decimal" value="${draft.total}" data-receipt-meta="total" /></div>
        </div>
      </div>
      <div class="receipt-split-panel">
        <div class="field">
          <label>${T.participants}</label>
          <div class="meta-row">${participantChecklist(trip, selectedParticipantIds)}</div>
        </div>
        <p class="helper-text">${T.splitHint}</p>
      </div>
      <div class="list" style="margin-top:14px">${draft.items.map(renderReceiptItem).join("")}</div>
      <div class="receipt-summary"><span>${T.total}</span><strong>${draft.total} ${escapeHtml(draft.currency)}</strong></div>
      <div class="form-row" style="margin-top:14px">
        <button class="button secondary" type="button" data-add-receipt-row>${T.addItem}</button>
        <button class="button primary" type="button" data-import-receipt>${T.importExpense}</button>
      </div>
    </section>
  `;
}

function renderReceiptItem(item) {
  return `
    <div class="receipt-item">
      <div class="receipt-item-grid">
        <div class="field"><label>${T.original}</label><input class="input" value="${escapeHtml(item.originalName)}" data-receipt-item="${item.id}" data-receipt-field="originalName" /></div>
        <div class="field"><label>${T.zh}</label><input class="input" value="${escapeHtml(item.translatedName)}" data-receipt-item="${item.id}" data-receipt-field="translatedName" /></div>
        <div class="field"><label>${T.category}</label><select class="select" data-receipt-item="${item.id}" data-receipt-field="category">${EXPENSE_CATEGORIES.map((cat) => `<option value="${cat}" ${item.category === cat ? "selected" : ""}>${cat}</option>`).join("")}</select></div>
      </div>
      <div class="receipt-item-grid">
        <div class="field"><label>${T.unitPrice}</label><input class="input" inputmode="decimal" value="${item.unitPrice}" data-receipt-item="${item.id}" data-receipt-field="unitPrice" /></div>
        <div class="field"><label>${T.quantity}</label><input class="input" inputmode="decimal" value="${item.quantity}" data-receipt-item="${item.id}" data-receipt-field="quantity" /></div>
        <div class="field"><label>${T.subtotal}</label><input class="input" inputmode="decimal" value="${item.subtotal}" data-receipt-item="${item.id}" data-receipt-field="subtotal" /></div>
      </div>
      <button class="action-pill danger" type="button" data-delete-receipt-row="${item.id}">${T.deleteItem}</button>
    </div>
  `;
}

function importReceipt(trip) {
  const validMemberIds = new Set(trip.members.map((member) => member.id));
  const payerId = state.ocrPayerId && validMemberIds.has(state.ocrPayerId) ? state.ocrPayerId : trip.members[0]?.id;
  const chosenParticipantIds = (state.ocrParticipantIds || []).filter((id) => validMemberIds.has(id));
  const participantIds = chosenParticipantIds.length ? chosenParticipantIds : trip.members.map((member) => member.id);
  const receiptItems = state.ocrDraft.items.filter((item) => Number(item.subtotal || 0) > 0 && (item.originalName || item.translatedName));
  if (receiptItems.length === 0) {
    state.error = T.noItems;
    return;
  }

  const receiptBatchId = crypto.randomUUID();
  state.store = updateActiveTrip(state.store, (draft) => {
    draft.receiptBatches.push({
      id: receiptBatchId,
      merchantName: state.ocrDraft.merchantName,
      receiptDate: state.ocrDraft.receiptDate,
      currency: state.ocrDraft.currency,
      totalOriginal: state.ocrDraft.total,
      exchangeRate: draft.exchangeRate,
      photoUrl: state.ocrDraft.photoUrl || state.receiptPhotoDraftUrl || "",
      photoPath: state.ocrDraft.photoPath || state.receiptPhotoDraftPath || "",
      photoProvider: state.ocrDraft.photoProvider || state.receiptPhotoDraftProvider || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const expenses = receiptItems.map((item) => createExpenseFromReceiptItem(item, {
      receiptBatchId,
      currency: state.ocrDraft.currency,
      exchangeRate: draft.exchangeRate,
      payerId,
      participantIds,
      splitMode: "equal",
      splitValues: buildSplitValues(participantIds, "equal", {}, state.ocrDraft.total),
      expenseDate: state.ocrDraft.receiptDate || draft.startDate,
      receiptPhotoUrl: state.ocrDraft.photoUrl || state.receiptPhotoDraftUrl || "",
      receiptPhotoPath: state.ocrDraft.photoPath || state.receiptPhotoDraftPath || "",
      receiptPhotoProvider: state.ocrDraft.photoProvider || state.receiptPhotoDraftProvider || "",
    }));
    draft.expenseItems.push(...expenses);
    return draft;
  });

  state.notice = T.imported;
  state.ocrDraft = null;
  state.ocrPayerId = "";
  state.ocrParticipantIds = [];
  state.receiptPhotoDraftUrl = "";
  state.receiptPhotoDraftPath = "";
  state.receiptPhotoDraftProvider = "";
  if (state.imagePreviewUrl) URL.revokeObjectURL(state.imagePreviewUrl);
  state.imagePreviewUrl = "";
  state.activeTab = "expenses";
  location.hash = "#/expenses";
}

function memberSelect(trip, id, selectedId = "") {
  return `<select class="select" id="${id}" data-ocr-payer="1">${trip.members.map((member) => `<option value="${member.id}" ${member.id === selectedId ? "selected" : ""}>${escapeHtml(member.name)}</option>`).join("")}</select>`;
}

function participantChecklist(trip, selectedIds) {
  const selected = new Set(selectedIds);
  return trip.members
    .map(
      (member) => `
        <label class="member-chip">
          <input type="checkbox" value="${member.id}" data-ocr-participant="1" ${selected.has(member.id) ? "checked" : ""} />
          ${escapeHtml(member.name)}
        </label>
      `,
    )
    .join("");
}

function cameraSvg() {
  return `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.8l1.2-1.8h5L15.7 6h1.8A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z"/>
      <circle cx="12" cy="12.5" r="3.5"/>
    </svg>
  `;
}

