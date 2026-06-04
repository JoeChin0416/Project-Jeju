import { updateActiveTrip } from "../state/trip-store.js?v=20260604-qa-weather-ocr";
import { state } from "../state/app-state.js";
import { escapeHtml, formToObject } from "../utils/dom.js";
import { PACKING_CATEGORIES, groupPackingByCategory } from "../features/packing.js";

export function packingView(trip, render) {
  const ownerId = state.user?.uid || "demo-user";
  state.packingOwnerId = ownerId;
  const ownerItems = trip.packingItems.filter((item) => item.ownerId === ownerId);
  const checkedCount = ownerItems.filter((item) => item.checked).length;
  const addLabel = "\u65b0\u589e\u884c\u674e";
  return {
    html: `
      <section class="panel span-all">
        <div class="section-title">
          <div><h2>\u500b\u4eba\u884c\u674e\u6e05\u55ae</h2><p>\u884c\u674e\u662f\u6bcf\u500b\u5e33\u865f\u5404\u81ea\u7ba1\u7406\uff1b\u884c\u7a0b\u3001\u8a18\u5e33\u8207\u65c5\u8a18\u5247\u662f\u5171\u540c\u540c\u6b65\u3002</p></div>
          <span class="pill">${checkedCount}/${ownerItems.length}</span>
        </div>
      </section>
      <section class="panel span-all">
        <div class="list">
          ${renderPackingGroups(ownerItems)}
        </div>
      </section>
      <button class="fab" type="button" data-open-packing-sheet aria-label="${addLabel}">+</button>
      ${renderPackingSheet(trip, ownerId)}
    `,
    bind(root) {
      root.addEventListener("click", (event) => {
        const editId = event.target.closest("[data-pack-edit]")?.dataset.packEdit;
        const deleteId = event.target.closest("[data-pack-delete]")?.dataset.packDelete;

        if (event.target.closest("[data-open-packing-sheet]")) {
          state.modal = { type: "packing", mode: "add", itemId: null };
          render();
          return;
        }

        if (editId) {
          state.modal = { type: "packing", mode: "edit", itemId: editId };
          render();
          return;
        }

        if (deleteId) {
          state.store = updateActiveTrip(state.store, (draft) => {
            draft.packingItems = draft.packingItems.filter((item) => item.id !== deleteId);
            return draft;
          });
          render();
          return;
        }

        if (event.target.closest("[data-close-sheet]")) {
          state.modal = null;
          render();
        }
      });

      root.querySelector("[data-packing-form]")?.addEventListener("submit", (event) => {
        event.preventDefault();
        const data = formToObject(event.currentTarget);
        state.store = updateActiveTrip(state.store, (draft) => {
          const payload = {
            ownerId,
            name: data.name,
            category: data.category || PACKING_CATEGORIES[0],
          };
          if (state.modal?.mode === "edit") {
            const item = draft.packingItems.find((entry) => entry.id === state.modal.itemId);
            if (item) Object.assign(item, payload);
          } else {
            draft.packingItems.push({
              id: crypto.randomUUID(),
              ...payload,
              checked: false,
              sortOrder: draft.packingItems.filter((item) => item.ownerId === ownerId).length + 1,
            });
          }
          return draft;
        });
        state.modal = null;
        render();
      });

      root.addEventListener("change", (event) => {
        const id = event.target.dataset.packToggle;
        if (!id) return;
        state.store = updateActiveTrip(state.store, (draft) => {
          const item = draft.packingItems.find((entry) => entry.id === id);
          if (item) item.checked = event.target.checked;
          return draft;
        });
        render();
      });
    },
  };
}

function renderPackingGroups(items) {
  const groups = groupPackingByCategory(items.sort((a, b) => a.sortOrder - b.sortOrder));
  if (groups.length === 0) return `<div class="empty">\u9019\u88e1\u9084\u6c92\u6709\u884c\u674e\u9805\u76ee</div>`;
  return groups
    .map(
      (group) => `
        <div class="category-block">
          <h3 class="category-title">${escapeHtml(group.category)}</h3>
          ${group.items
            .map(
              (item) => `
                <div class="card packing-row ${item.checked ? "is-checked" : ""}">
                  <label class="packing-left">
                    <input type="checkbox" data-pack-toggle="${item.id}" ${item.checked ? "checked" : ""} />
                    <span><strong class="packing-name">${escapeHtml(item.name)}</strong></span>
                  </label>
                  <div class="row-actions">
                    <button class="action-pill" type="button" data-pack-edit="${item.id}">\u7de8\u8f2f</button>
                    <button class="action-pill danger" type="button" data-pack-delete="${item.id}">\u522a\u9664</button>
                  </div>
                </div>
              `,
            )
            .join("")}
        </div>
      `,
    )
    .join("");
}

function renderPackingSheet(trip) {
  if (state.modal?.type !== "packing") return "";
  const item = state.modal.mode === "edit"
    ? trip.packingItems.find((entry) => entry.id === state.modal.itemId)
    : null;
  const title = item ? "\u7de8\u8f2f\u884c\u674e" : "\u65b0\u589e\u884c\u674e";
  return `
    <div class="sheet-backdrop">
      <section class="bottom-sheet" role="dialog" aria-modal="true" aria-label="${title}">
        <div class="sheet-head">
          <h2>${title}</h2>
          <button class="action-pill" type="button" data-close-sheet>\u95dc\u9589</button>
        </div>
        <form class="form-grid" data-packing-form>
          <div class="field"><label>\u54c1\u9805</label><input class="input" name="name" value="${escapeHtml(item?.name || "")}" required /></div>
          <div class="field">
            <label>\u5206\u985e</label>
            <select class="select" name="category">
              ${PACKING_CATEGORIES.map((category) => `<option value="${category}" ${category === (item?.category || PACKING_CATEGORIES[0]) ? "selected" : ""}>${category}</option>`).join("")}
            </select>
          </div>
          <button class="button primary full" type="submit">${item ? "\u5132\u5b58\u884c\u674e" : "\u65b0\u589e\u884c\u674e"}</button>
        </form>
      </section>
    </div>
  `;
}

