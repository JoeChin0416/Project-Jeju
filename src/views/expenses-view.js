import { EXPENSE_CATEGORIES, normalizeExpenseCategory } from "../features/expense-categories.js?v=20260623-split-ratio-clear";
import { buildCategoryPieGradient, summarizeDailySpending } from "../features/expense-dashboard.js";
import { convertFromBaseAmount, convertToBaseAmount } from "../features/expenses.js";
import { calculateMemberExpenseSummary, getExpenseDate, listExpenseDates } from "../features/expense-summary.js?v=20260623-split-ratio-clear";
import { calculateSettlement } from "../features/settlement.js";
import { buildDefaultRatioWeights, buildSplitPreview, buildSplitValues, readSplitValuesFromForm, shouldFillMissingRatioInput } from "../features/split-values.js?v=20260623-split-ratio-clear";
import { resolveAvatarUrl } from "../features/avatar-presets.js?v=20260623-split-ratio-clear";
import { state } from "../state/app-state.js";
import { updateActiveTrip } from "../state/trip-store.js?v=20260623-split-ratio-clear";
import { formatCurrency } from "../utils/currency.js";
import { escapeHtml, formToObject } from "../utils/dom.js";

const T = {
  dashboard: "\u6210\u54e1\u652f\u51fa",
  dashboardHelp: "\u6de8\u984d = \u4ed8\u6b3e - \u61c9\u8ca0\u64d4",
  paid: "\u4ed8\u6b3e",
  spent: "\u61c9\u8ca0\u64d4",
  transfers: "\u4ed8\u6b3e\u8a66\u7b97",
  payTo: "\u4ed8\u7d66",
  noTransfer: "\u76ee\u524d\u4e0d\u9700\u8981\u4e92\u76f8\u8f49\u5e33",
  daily: "\u6bcf\u65e5\u8a18\u5e33",
  dailyCuteDashboard: "\u6bcf\u65e5\u82b1\u8cbb\u5100\u8868\u677f",
  todaySpend: "\u4eca\u65e5\u82b1\u8cbb",
  tripSpend: "\u7d2f\u8a08\u82b1\u8cbb",
  perPersonAverage: "\u6bcf\u4eba\u5e73\u5747",
  topCategory: "\u6700\u9ad8\u5206\u985e",
  noCategory: "\u5c1a\u7121\u5206\u985e",
  budgetOk: "\u5728\u9810\u7b97\u5167",
  budgetOver: "\u5df2\u8d85\u652f",
  budgetLeft: "\u9810\u7b97\u5269\u9918",
  budgetExceeded: "\u8d85\u51fa",
  dayExpense: "\u7684\u652f\u51fa",
  noExpense: "\u9019\u4e00\u5929\u9084\u6c92\u6709\u8a18\u5e33",
  addExpense: "\u65b0\u589e\u8a18\u5e33",
  editExpense: "\u7de8\u8f2f\u8a18\u5e33",
  item: "\u54c1\u9805",
  category: "\u5206\u985e",
  date: "\u65e5\u671f",
  originalAmount: "\u539f\u5e63\u91d1\u984d",
  baseAmount: "\u53f0\u5e63\u91d1\u984d",
  currency: "\u5e63\u5225",
  rate: "\u532f\u7387",
  payer: "\u4ed8\u6b3e\u4eba",
  participants: "\u5206\u5e33\u5c0d\u8c61",
  splitShare: "目前分攤",
  splitMode: "分帳方式",
  splitEqual: "平均",
  splitRatio: "比例",
  splitFixed: "指定金額",
  splitEqualHelp: "依勾選人數平均分攤。",
  splitRatioHelp: "直接輸入每個人的比例數字；實際分攤比例會自動換算。",
  splitFixedHelp: "直接輸入每個人要分攤的台幣金額。",
  notShared: "不分帳",
  equalShare: "平均分攤",
  allocated: "已分配",
  remaining: "剩餘",
  overAllocated: "超出",
  save: "\u5132\u5b58",
  close: "\u95dc\u9589",
  edit: "\u7de8\u8f2f",
  delete: "\u522a\u9664",
  receiptPhoto: "\u6536\u64da\u7167\u7247",
  payerPrefix: "\u4ed8\u6b3e\u4eba",
  journalDay: "\u65c5\u8a18\u65e5",
  count: "\u7b46",
  unknownMember: "\u672a\u77e5\u6210\u54e1",
};

export function expensesView(trip, render) {
  const settlement = calculateSettlement(trip.members, trip.expenseItems);
  const memberSummary = calculateMemberExpenseSummary(trip.members, trip.expenseItems);
  const dates = listExpenseDates(trip);
  const activeDate = dates.includes(state.expenseDateFilter) ? state.expenseDateFilter : dates[0] || trip.startDate || new Date().toISOString().slice(0, 10);
  const dayExpenses = trip.expenseItems.filter((item) => getExpenseDate(item, trip) === activeDate);

  return {
    html: `
      ${renderDailySpendingDashboard(trip, activeDate)}
      ${renderMemberDashboard(trip, memberSummary)}
      ${renderTransferPanel(trip, settlement)}
      ${renderDateTabs(trip, dates, activeDate)}
      <section class="panel span-all expense-ledger">
        <div class="section-title"><div><h2>${T.daily}</h2><p>${escapeHtml(activeDate)} ${T.dayExpense}</p></div></div>
        <div class="list">${dayExpenses.map((item) => renderExpense(item, trip)).join("") || `<div class="empty">${T.noExpense}</div>`}</div>
      </section>
      <button class="fab" type="button" data-open-expense-sheet aria-label="${T.addExpense}">+</button>
      ${renderExpenseSheet(trip, activeDate)}
    `,
    bind(root) {
      root.addEventListener("click", (event) => {
        const date = event.target.closest("[data-expense-date-tab]")?.dataset.expenseDateTab;
        if (date) {
          state.expenseDateFilter = date;
          render();
          return;
        }
        if (event.target.closest("[data-open-expense-sheet]")) {
          state.modal = { type: "expense", mode: "add", id: null, expenseDate: activeDate };
          render();
          return;
        }
        if (event.target.closest("[data-close-sheet]")) {
          state.modal = null;
          render();
          return;
        }
        const editId = event.target.closest("[data-edit-expense]")?.dataset.editExpense;
        const deleteId = event.target.closest("[data-delete-expense]")?.dataset.deleteExpense;
        if (editId) {
          state.modal = { type: "expense", mode: "edit", id: editId, expenseDate: activeDate };
          render();
          return;
        }
        if (deleteId) {
          state.store = updateActiveTrip(state.store, (draft) => {
            draft.expenseItems = draft.expenseItems.filter((item) => item.id !== deleteId);
            return draft;
          });
          render();
        }
      });
      const expenseForm = root.querySelector("[data-expense-form]");
      if (expenseForm) bindExpenseFormInteractions(expenseForm, trip);
      expenseForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        const data = formToObject(event.currentTarget);
        const participantIds = [...root.querySelectorAll("[name='participantIds']:checked")].map((input) => input.value);
        const exchangeRate = Number(data.exchangeRate || trip.exchangeRate || 1);
        const enteredBase = parseFiniteNumber(data.totalBase);
        const enteredOriginal = parseFiniteNumber(data.totalOriginal);
        const totalBase = enteredBase ?? (enteredOriginal !== null ? convertToBaseAmount(enteredOriginal, exchangeRate) : 0);
        const totalOriginal = enteredOriginal ?? (enteredBase !== null ? convertFromBaseAmount(enteredBase, exchangeRate) : 0);
        const splitMode = data.splitMode || "equal";
        const splitValues = buildSplitValues(participantIds, splitMode, readSplitValuesFromForm(event.currentTarget, splitMode), totalBase);
        const entry = state.modal?.mode === "edit" ? trip.expenseItems.find((item) => item.id === state.modal.id) : null;
        const item = {
          id: state.modal?.mode === "edit" ? state.modal.id : crypto.randomUUID(),
          receiptBatchId: entry?.receiptBatchId ?? null,
          source: entry?.source || "manual",
          originalName: data.translatedName,
          translatedName: data.translatedName,
          category: normalizeExpenseCategory(data.category),
          quantity: 1,
          unitPriceOriginal: totalOriginal,
          totalOriginal,
          currency: data.currency || trip.tripCurrency,
          exchangeRate,
          totalBase,
          payerId: data.payerId,
          participantIds,
          splitMode,
          splitValues,
          expenseDate: data.expenseDate || activeDate,
          receiptPhotoUrl: entry?.receiptPhotoUrl || "",
          receiptPhotoPath: entry?.receiptPhotoPath || "",
          receiptPhotoProvider: entry?.receiptPhotoProvider || "",
          createdAt: entry?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        state.store = updateActiveTrip(state.store, (draft) => {
          const index = draft.expenseItems.findIndex((entry) => entry.id === item.id);
          if (index >= 0) draft.expenseItems[index] = { ...draft.expenseItems[index], ...item };
          else draft.expenseItems.push(item);
          return draft;
        });
        state.expenseDateFilter = item.expenseDate;
        state.modal = null;
        render();
      });
    },
  };
}

function renderDailySpendingDashboard(trip, activeDate) {
  const summary = summarizeDailySpending(trip, activeDate);
  const gradient = buildCategoryPieGradient(summary.categoryTotals);
  const budgetText = summary.isOverBudget
    ? `${T.budgetOver} ${formatCurrency(Math.abs(summary.budgetDelta))}`
    : `${T.budgetLeft} ${formatCurrency(summary.budgetDelta)}`;
  return `
    <section class="panel span-all daily-spend-dashboard">
      <div class="section-title">
        <div><h2>${T.dailyCuteDashboard}</h2><p>${escapeHtml(activeDate)} ・ ${summary.isOverBudget ? T.budgetOver : T.budgetOk}</p></div>
        <span class="pill">${budgetText}</span>
      </div>
      <div class="daily-spend-grid">
        <div class="daily-spend-pie" style="--pie:${escapeHtml(gradient)}">
          <div><strong>${Math.min(999, Math.round(summary.budgetRatio * 100))}%</strong><span>${T.todaySpend}</span></div>
        </div>
        <div class="daily-spend-stats">
          <span>${T.todaySpend}<strong>${formatCurrency(summary.todayTotal)}</strong></span>
          <span>${T.tripSpend}<strong>${formatCurrency(summary.tripTotal)}</strong></span>
          <span>${T.perPersonAverage}<strong>${formatCurrency(summary.averagePerMember)}</strong></span>
          <span>${T.topCategory}<strong>${escapeHtml(summary.topCategory?.category || T.noCategory)}</strong></span>
        </div>
      </div>
      <div class="category-spend-list">
        ${summary.categoryTotals.map((entry) => `
          <div class="category-spend-item" style="--category-color:${entry.color}">
            <span>${escapeHtml(entry.category)}</span>
            <strong>${formatCurrency(entry.amount)}</strong>
            <em style="width:${Math.max(4, Math.round(entry.ratio * 100))}%"></em>
          </div>
        `).join("") || `<div class="empty">${T.noExpense}</div>`}
      </div>
    </section>
  `;
}

function renderMemberDashboard(trip, summary) {
  return `
    <section class="panel span-all expense-dashboard">
      <div class="section-title"><div><h2>${T.dashboard}</h2><p>${T.dashboardHelp}</p></div></div>
      <div class="member-expense-grid">
        ${trip.members.map((member) => {
          const entry = summary[member.id] || { paid: 0, spent: 0, net: 0 };
          return `
            <article class="member-expense-card" style="--member-color:${member.color}">
              <span class="member-color-bar"></span>
              <div class="member-expense-head"><img class="member-avatar" src="${escapeHtml(resolveAvatarUrl(member.avatarPresetId, member.avatarUrl))}" alt="" /><div><h3>${escapeHtml(member.name)}</h3><span class="${entry.net >= 0 ? "positive" : "negative"}">${formatCurrency(entry.net)}</span></div></div>
              <div class="member-expense-stats"><span>${T.paid}<strong>${formatCurrency(entry.paid)}</strong></span><span>${T.spent}<strong>${formatCurrency(entry.spent)}</strong></span></div>
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderTransferPanel(trip, settlement) {
  return `
    <section class="panel span-all">
      <div class="section-title"><h2>${T.transfers}</h2></div>
      <div class="transfer-list">
        ${settlement.transfers.map((transfer) => `<div class="transfer-card"><span>${nameOf(trip, transfer.fromId)}</span><span class="transfer-arrow">${T.payTo}</span><span>${nameOf(trip, transfer.toId)}</span><strong class="money">${formatCurrency(transfer.amount)}</strong></div>`).join("") || `<div class="empty">${T.noTransfer}</div>`}
      </div>
    </section>
  `;
}

function renderDateTabs(trip, dates, activeDate) {
  return `
    <section class="panel span-all expense-day-panel">
      <div class="expense-day-tabs">
        ${dates.map((date) => {
          const day = trip.itineraryDays.find((entry) => entry.date === date);
          const count = (trip.expenseItems || []).filter((entry) => getExpenseDate(entry, trip) === date).length;
          return `<button class="expense-day-tab ${date === activeDate ? "is-active" : ""}" type="button" data-expense-date-tab="${date}"><span>${escapeHtml(day?.title || T.journalDay)}</span><strong>${escapeHtml(date.slice(5))}</strong><em>${count} ${T.count}</em></button>`;
        }).join("")}
      </div>
    </section>
  `;
}

function renderExpense(item, trip) {
  const receipt = trip.receiptBatches?.find((batch) => batch.id === item.receiptBatchId);
  const photoUrl = item.receiptPhotoUrl || receipt?.photoUrl || "";
  return `
    <article class="expense-entry ${photoUrl ? "has-receipt-photo" : ""}">
      <span class="expense-entry-color" style="--payer-color:${memberOf(trip, item.payerId)?.color || "#116b63"}"></span>
      <div class="expense-entry-main">
        <div><h3>${escapeHtml(item.translatedName || item.originalName)}</h3><p>${escapeHtml(item.category)} ・ ${T.payerPrefix} ${escapeHtml(nameOf(trip, item.payerId))}</p></div>
        <strong>${formatCurrency(item.totalBase)}</strong>
        ${photoUrl ? `<a class="expense-receipt-thumb" href="${escapeHtml(photoUrl)}" target="_blank" rel="noreferrer" aria-label="${T.receiptPhoto}"><img src="${escapeHtml(photoUrl)}" alt="${T.receiptPhoto}" /></a>` : ""}
      </div>
      <div class="expense-entry-side"><span>${escapeHtml(item.expenseDate || "")}</span><div class="row-actions"><button class="action-pill" data-edit-expense="${item.id}">${T.edit}</button><button class="action-pill danger" data-delete-expense="${item.id}">${T.delete}</button></div></div>
    </article>
  `;
}

function renderExpenseSheet(trip, activeDate) {
  if (state.modal?.type !== "expense") return "";
  const entry = state.modal.mode === "edit" ? trip.expenseItems.find((item) => item.id === state.modal.id) : null;
  const participants = new Set(entry?.participantIds || trip.members.map((member) => member.id));
  const splitMode = entry?.splitMode || "equal";
  const splitValues = entry?.splitValues || {};
  return `
    <div class="sheet-backdrop">
      <section class="bottom-sheet">
        <div class="sheet-head"><h2>${entry ? T.editExpense : T.addExpense}</h2><button class="action-pill" data-close-sheet>${T.close}</button></div>
        <form class="form-grid" data-expense-form>
          <div class="field"><label>${T.item}</label><input class="input" name="translatedName" value="${escapeHtml(entry?.translatedName || "")}" required /></div>
          <div class="form-row"><div class="field"><label>${T.category}</label><select class="select" name="category">${EXPENSE_CATEGORIES.map((cat) => `<option value="${cat}" ${entry?.category === cat ? "selected" : ""}>${cat}</option>`).join("")}</select></div><div class="field"><label>${T.date}</label><input class="input" type="date" name="expenseDate" value="${escapeHtml(entry?.expenseDate || activeDate)}" /></div></div>
          <div class="form-row"><div class="field"><label>${T.originalAmount}</label><input class="input" name="totalOriginal" inputmode="decimal" value="${escapeHtml(entry?.totalOriginal || "")}" data-amount-original /></div><div class="field"><label>${T.baseAmount}</label><input class="input" name="totalBase" inputmode="decimal" value="${escapeHtml(entry?.totalBase || "")}" data-amount-base /></div></div>
          <div class="form-row"><div class="field"><label>${T.currency}</label><input class="input" name="currency" value="${escapeHtml(entry?.currency || trip.tripCurrency)}" /></div><div class="field"><label>${T.rate}</label><input class="input" name="exchangeRate" inputmode="decimal" value="${escapeHtml(entry?.exchangeRate || trip.exchangeRate)}" data-amount-rate /></div></div>
          <div class="field"><label>${T.payer}</label><select class="select" name="payerId">${trip.members.map((member) => `<option value="${member.id}" ${entry?.payerId === member.id ? "selected" : ""}>${escapeHtml(member.name)}</option>`).join("")}</select></div>
          <div class="field"><label>${T.participants}</label><div class="meta-row">${trip.members.map((member) => `<label class="member-chip"><input type="checkbox" name="participantIds" value="${member.id}" ${participants.has(member.id) ? "checked" : ""} />${escapeHtml(member.name)}</label>`).join("")}</div></div>
          ${renderSplitModeControls(splitMode)}
          ${renderSplitControls(trip, participants, splitValues, splitMode)}
          <button class="button primary full" type="submit">${T.save}</button>
        </form>
      </section>
    </div>
  `;
}

function renderSplitModeControls(splitMode = "equal") {
  const modes = [
    ["equal", T.splitEqual],
    ["ratio", T.splitRatio],
    ["fixed", T.splitFixed],
  ];
  return `
    <div class="field split-mode-field">
      <label>${T.splitMode}</label>
      <div class="segmented split-mode-segmented">
        ${modes.map(([mode, label]) => `
          <label class="segment split-mode-option ${splitMode === mode ? "is-active" : ""}">
            <input class="visually-hidden" type="radio" name="splitMode" value="${mode}" ${splitMode === mode ? "checked" : ""} />
            ${label}
          </label>
        `).join("")}
      </div>
      <p class="form-help" data-split-mode-help></p>
    </div>
  `;
}

function renderSplitControls(trip, participants, splitValues = {}, splitMode = "equal") {
  const participantIds = trip.members.filter((member) => participants.has(member.id)).map((member) => member.id);
  const defaultWeights = buildDefaultRatioWeights(participantIds);
  const ratioValues = splitMode === "ratio" ? { ...defaultWeights, ...(splitValues || {}) } : defaultWeights;
  const fixedValues = splitMode === "fixed" ? splitValues || {} : {};
  const preview = buildSplitPreview(participantIds, splitMode, splitMode === "fixed" ? fixedValues : ratioValues);
  return `
    <div class="split-value-grid" data-split-controls>
      ${trip.members.map((member) => {
        const isIncluded = participants.has(member.id);
        const ratioValue = isIncluded ? (ratioValues[member.id] ?? defaultWeights[member.id] ?? 0) : "";
        const fixedValue = isIncluded ? (fixedValues[member.id] ?? "") : "";
        const percent = isIncluded ? `${preview[member.id] || 0}%` : T.notShared;
        return `
          <label class="split-value-row ${isIncluded ? "" : "is-disabled"}" data-split-row data-split-member="${member.id}">
            <span>${escapeHtml(member.name)}<em data-split-percent>${percent}</em></span>
            <div class="split-input-stack">
              <input class="input split-value-input split-ratio-input ${splitMode === "ratio" ? "" : "is-hidden"}" type="number" inputmode="decimal" min="0" max="100" step="1" data-split-ratio-value="${member.id}" value="${escapeHtml(ratioValue)}" ${isIncluded && splitMode === "ratio" ? "" : "disabled"} />
              <input class="input split-value-input split-fixed-input ${splitMode === "fixed" ? "" : "is-hidden"}" type="number" inputmode="decimal" min="0" step="1" data-split-fixed-value="${member.id}" value="${escapeHtml(fixedValue)}" ${isIncluded && splitMode === "fixed" ? "" : "disabled"} />
              <strong class="split-equal-label ${splitMode === "equal" ? "" : "is-hidden"}" data-split-equal-label>${T.equalShare}</strong>
            </div>
          </label>
        `;
      }).join("")}
      <div class="split-total-status is-hidden" data-split-total-status></div>
    </div>
  `;
}

function bindExpenseFormInteractions(form, trip) {
  const originalInput = form.querySelector("[data-amount-original]");
  const baseInput = form.querySelector("[data-amount-base]");
  const rateInput = form.querySelector("[data-amount-rate]");
  let lastAmountSource = originalInput?.value ? "original" : "base";

  const getSplitMode = () => new FormData(form).get("splitMode") || "equal";

  const syncAmounts = (source) => {
    if (!originalInput || !baseInput || !rateInput) return;
    lastAmountSource = source;
    const rate = Number(rateInput.value || trip.exchangeRate || 1);
    if (source === "original") {
      baseInput.value = originalInput.value.trim() ? convertToBaseAmount(originalInput.value, rate) : "";
    } else {
      originalInput.value = baseInput.value.trim() ? convertFromBaseAmount(baseInput.value, rate) : "";
    }
    refreshSplitControls();
  };

  originalInput?.addEventListener("input", () => syncAmounts("original"));
  baseInput?.addEventListener("input", () => syncAmounts("base"));
  rateInput?.addEventListener("input", () => syncAmounts(lastAmountSource));

  const refreshSplitControls = (changedInput = null) => {
    const splitMode = getSplitMode();
    const participantIds = [...form.querySelectorAll("[name='participantIds']:checked")].map((input) => input.value);
    const defaultWeights = buildDefaultRatioWeights(participantIds);
    const participantSet = new Set(participantIds);

    form.querySelectorAll("[name='splitMode']").forEach((input) => {
      input.closest(".segment")?.classList.toggle("is-active", input.checked);
    });
    const help = form.querySelector("[data-split-mode-help]");
    if (help) {
      help.textContent = splitMode === "fixed"
        ? T.splitFixedHelp
        : splitMode === "ratio"
          ? T.splitRatioHelp
          : T.splitEqualHelp;
    }

    form.querySelectorAll("[data-split-row]").forEach((row) => {
      const memberId = row.dataset.splitMember;
      const ratioInput = row.querySelector("[data-split-ratio-value]");
      const fixedInput = row.querySelector("[data-split-fixed-value]");
      const equalLabel = row.querySelector("[data-split-equal-label]");
      const percent = row.querySelector("[data-split-percent]");
      const isIncluded = participantSet.has(memberId);
      row.classList.toggle("is-disabled", !isIncluded);
      ratioInput?.classList.toggle("is-hidden", splitMode !== "ratio");
      fixedInput?.classList.toggle("is-hidden", splitMode !== "fixed");
      equalLabel?.classList.toggle("is-hidden", splitMode !== "equal");
      if (ratioInput) {
        ratioInput.disabled = !isIncluded || splitMode !== "ratio";
        if (isIncluded && shouldFillMissingRatioInput(ratioInput, changedInput)) {
          ratioInput.value = String(defaultWeights[memberId] ?? 0);
          delete ratioInput.dataset.ratioUserCleared;
        }
      }
      if (fixedInput) fixedInput.disabled = !isIncluded || splitMode !== "fixed";
      if (percent && !isIncluded) percent.textContent = T.notShared;
    });

    let rawValues = readSplitValuesFromForm(form, splitMode);
    const preview = buildSplitPreview(participantIds, splitMode, rawValues);
    form.querySelectorAll("[data-split-row]").forEach((row) => {
      const memberId = row.dataset.splitMember;
      const percent = row.querySelector("[data-split-percent]");
      const isIncluded = participantSet.has(memberId);
      if (percent) percent.textContent = isIncluded ? `${preview[memberId] || 0}%` : T.notShared;
    });

    const status = form.querySelector("[data-split-total-status]");
    if (status) {
      status.classList.toggle("is-hidden", splitMode !== "fixed");
      if (splitMode === "fixed") {
        const totalBase = parseFiniteNumber(baseInput?.value) ?? 0;
        const fixedValues = readSplitValuesFromForm(form, "fixed");
        const allocated = participantIds.reduce((sum, id) => sum + Number(fixedValues[id] || 0), 0);
        const diff = Math.round((totalBase - allocated) * 100) / 100;
        status.classList.toggle("is-over", diff < 0);
        status.textContent = diff < 0
          ? `${T.allocated} ${formatCurrency(allocated)} / ${T.overAllocated} ${formatCurrency(Math.abs(diff))}`
          : `${T.allocated} ${formatCurrency(allocated)} / ${T.remaining} ${formatCurrency(diff)}`;
      }
    }
  };

  form.addEventListener("input", (event) => {
    if (event.target.matches("[data-split-ratio-value]")) markRatioInputEdit(event.target);
    if (event.target.matches("[data-split-ratio-value], [data-split-fixed-value]")) refreshSplitControls(event.target);
  });
  form.addEventListener("change", (event) => {
    if (event.target.matches("[name='participantIds'], [name='splitMode']")) refreshSplitControls();
    if (event.target.matches("[data-split-ratio-value]")) markRatioInputEdit(event.target);
    if (event.target.matches("[data-split-ratio-value], [data-split-fixed-value]")) refreshSplitControls(event.target);
  });
  refreshSplitControls();
}

function markRatioInputEdit(input) {
  if (input.value.trim() === "") input.dataset.ratioUserCleared = "true";
  else delete input.dataset.ratioUserCleared;
}

function parseFiniteNumber(value) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

function memberOf(trip, memberId) {
  return trip.members.find((member) => member.id === memberId);
}

function nameOf(trip, memberId) {
  return memberOf(trip, memberId)?.name || T.unknownMember;
}

