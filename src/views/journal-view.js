import {
  createJournalEntry,
  getJournalDate,
  JOURNAL_TYPES,
  listJournalDates,
  updateJournalEntry,
} from "../features/journal.js?v=20260623-split-ratio-clear";
import { getMood, TRIP_MOODS } from "../features/moods.js";
import { uploadJournalPhoto } from "../services/storage.js?v=20260623-split-ratio-clear";
import { state } from "../state/app-state.js";
import { updateActiveTrip } from "../state/trip-store.js?v=20260623-split-ratio-clear";
import { escapeHtml, formToObject } from "../utils/dom.js";
import { fileToCompressedImage } from "../utils/image.js?v=20260623-split-ratio-clear";

const T = {
  title: "\u65c5\u8a18",
  heroCopy: "\u62cd\u7167\u3001\u5099\u5fd8\u3001\u4ee3\u8fa6\u548c\u6bcf\u5929\u7684\u5fc3\u60c5\u4e00\u8d77\u7559\u4e0b\u4f86\u3002",
  entries: "\u7bc7",
  todayJournal: "\u65c5\u8a18",
  dayHelp: "\u53ef\u4ee5\u653e\u7167\u7247\u3001\u5099\u5fd8\u3001\u4ee3\u8fa6\uff0c\u6240\u6709\u6210\u54e1\u90fd\u53ef\u5171\u540c\u7de8\u8f2f\u3002",
  empty: "\u9019\u4e00\u5929\u9084\u6c92\u6709\u65c5\u8a18",
  openCamera: "\u958b\u555f\u76f8\u6a5f",
  addJournal: "\u65b0\u589e\u65c5\u8a18",
  uploadFailed: "\u7167\u7247\u4e0a\u50b3\u5931\u6557\uff0c\u8acb\u518d\u8a66\u4e00\u6b21\u3002",
  journalDay: "\u65c5\u8a18\u65e5",
  count: "\u7bc7",
  viewPhoto: "\u67e5\u770b\u7167\u7247",
  done: "\u5df2\u5b8c\u6210",
  markDone: "\u5b8c\u6210",
  edit: "\u7de8\u8f2f",
  delete: "\u522a\u9664",
  editJournal: "\u7de8\u8f2f\u65c5\u8a18",
  close: "\u95dc\u9589",
  type: "\u985e\u578b",
  day: "\u65e5\u671f",
  capturedAt: "\u62cd\u651d / \u8a18\u9304\u6642\u9593",
  entryTitle: "\u6a19\u984c",
  titlePlaceholder: "\u4f8b\uff1aOlive Young \u6230\u5229\u54c1",
  body: "\u5099\u8a3b",
  bodyPlaceholder: "\u53ef\u4ee5\u5beb\u7528\u9014\u3001\u5fc3\u60c5\u3001\u5f8c\u7e8c\u8981\u8a18\u5f97\u7684\u4e8b",
  tags: "\u6a19\u7c64",
  tagsPlaceholder: "\u8cfc\u7269 \u7a7f\u642d \u7f8e\u98df",
  mood: "\u5fc3\u60c5\u8cbc\u7d19",
  noMood: "\u5148\u4e0d\u9078",
  photo: "\u7167\u7247",
  previewAlt: "\u65c5\u8a18\u7167\u7247\u9810\u89bd",
  uploading: "\u7167\u7247\u4e0a\u50b3\u4e2d\uff0c\u5b8c\u6210\u5f8c\u518d\u5132\u5b58\u65c5\u8a18\u3002",
  saveEdit: "\u5132\u5b58\u65c5\u8a18",
  saveAdd: "\u65b0\u589e\u65c5\u8a18",
  photoViewer: "\u7167\u7247\u9810\u89bd",
};

export function journalView(trip, render) {
  const dates = listJournalDates(trip);
  const activeDate = dates.includes(state.journalDateFilter)
    ? state.journalDateFilter
    : dates[0] || trip.startDate || new Date().toISOString().slice(0, 10);
  const entries = [...(trip.travelNotes || [])]
    .filter((entry) => getJournalDate(entry, trip) === activeDate)
    .sort((a, b) => String(b.capturedAt || b.createdAt).localeCompare(String(a.capturedAt || a.createdAt)));

  async function handlePhotoFile(file, options = {}) {
    if (!file) return;
    const draftId = state.journalPhotoDraftId || state.modal?.id || crypto.randomUUID();
    state.journalPhotoDraftId = draftId;
    state.journalPhotoError = "";
    state.journalPhotoUploading = true;
    if (options.openModal) state.modal = { type: "journal", mode: "add", id: null, noteDate: activeDate };
    render();

    let localPreviewUrl = "";
    try {
      const image = await fileToCompressedImage(file);
      localPreviewUrl = image.previewUrl;
      state.journalPhotoPreviewUrl = localPreviewUrl;
      render();

      const uploaded = await uploadJournalPhoto(image.blob, {
        tripId: trip.id,
        draftId,
        fileName: image.fileName,
        user: state.user,
      });
      state.journalPhotoDraftUrl = uploaded.photoUrl;
      state.journalPhotoPreviewUrl = uploaded.photoUrl;
      state.journalPhotoDraftPath = uploaded.photoPath;
      state.journalPhotoDraftProvider = uploaded.photoProvider;
    } catch (error) {
      state.journalPhotoError = error?.message || T.uploadFailed;
    } finally {
      state.journalPhotoUploading = false;
      if (localPreviewUrl && state.journalPhotoPreviewUrl !== localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
      render();
    }
  }

  return {
    html: `
      <section class="panel span-all journal-hero">
        <div>
          <span class="brand-mark"><span class="brand-dot"></span>Travel Journal</span>
          <h2>${T.title}</h2>
          <p>${T.heroCopy}</p>
        </div>
        <div class="journal-hero-stats">
          <strong>${trip.travelNotes?.length || 0}</strong>
          <span>${T.entries}</span>
        </div>
      </section>

      ${renderDateTabs(trip, dates, activeDate)}

      <section class="panel span-all">
        <div class="section-title">
          <div><h2>${escapeHtml(activeDate)} ${T.todayJournal}</h2><p>${T.dayHelp}</p></div>
        </div>
        <div class="journal-grid">
          ${entries.map((entry) => renderJournalEntry(entry)).join("") || `<div class="empty">${T.empty}</div>`}
        </div>
      </section>

      <div class="journal-fab-stack">
        <button class="fab journal-camera-fab" type="button" data-open-journal-camera aria-label="${T.openCamera}">${cameraIcon()}</button>
        <button class="fab" type="button" data-open-journal-sheet aria-label="${T.addJournal}">+</button>
      </div>
      <input class="visually-hidden" type="file" accept="image/*" capture="environment" data-journal-camera-input />
      ${renderJournalSheet(activeDate, trip)}
      ${renderJournalPhotoViewer(trip)}
    `,
    bind(root) {
      root.addEventListener("click", (event) => {
        const date = event.target.closest("[data-journal-date-tab]")?.dataset.journalDateTab;
        if (date) {
          state.journalDateFilter = date;
          render();
          return;
        }

        const photoId = event.target.closest("[data-journal-photo-view]")?.dataset.journalPhotoView;
        if (photoId) {
          state.modal = { type: "journalPhoto", id: photoId };
          render();
          return;
        }

        if (event.target.closest("[data-open-journal-camera]")) {
          root.querySelector("[data-journal-camera-input]")?.click();
          return;
        }

        if (event.target.closest("[data-open-journal-sheet]")) {
          resetJournalPhotoDraft();
          state.modal = { type: "journal", mode: "add", id: null, noteDate: activeDate };
          render();
          return;
        }

        if (event.target.closest("[data-close-sheet]")) {
          state.modal = null;
          resetJournalPhotoDraft();
          render();
          return;
        }

        const editId = event.target.closest("[data-journal-edit]")?.dataset.journalEdit;
        const deleteId = event.target.closest("[data-journal-delete]")?.dataset.journalDelete;
        const toggleId = event.target.closest("[data-journal-toggle]")?.dataset.journalToggle;
        if (editId) {
          const entry = trip.travelNotes.find((item) => item.id === editId);
          setJournalPhotoDraft(entry);
          state.modal = { type: "journal", mode: "edit", id: editId, noteDate: activeDate };
          render();
          return;
        }
        if (deleteId) {
          state.store = updateActiveTrip(state.store, (draft) => {
            draft.travelNotes = draft.travelNotes.filter((entry) => entry.id !== deleteId);
            return draft;
          });
          render();
          return;
        }
        if (toggleId) {
          state.store = updateActiveTrip(state.store, (draft) => {
            const entry = draft.travelNotes.find((item) => item.id === toggleId);
            if (entry) {
              entry.done = !entry.done;
              entry.updatedBy = state.user?.email || state.user?.uid || "";
              entry.updatedAt = new Date().toISOString();
            }
            return draft;
          });
          render();
        }
      });

      root.querySelector("[data-journal-camera-input]")?.addEventListener("change", (event) => {
        handlePhotoFile(event.currentTarget.files?.[0], { openModal: true });
      });
      root.querySelector("[data-journal-photo-input]")?.addEventListener("change", (event) => {
        handlePhotoFile(event.currentTarget.files?.[0]);
      });
      root.querySelector("[data-journal-form]")?.addEventListener("submit", (event) => {
        event.preventDefault();
        if (state.journalPhotoUploading) return;
        const data = formToObject(event.currentTarget);
        const payload = {
          ...data,
          id: state.modal?.mode === "add" ? state.journalPhotoDraftId : undefined,
          done: data.done === "on",
          photoUrl: state.journalPhotoDraftUrl,
          photoPath: state.journalPhotoDraftPath,
          photoProvider: state.journalPhotoDraftProvider,
        };
        state.store = updateActiveTrip(state.store, (draft) => {
          if (state.modal?.mode === "edit") {
            const index = draft.travelNotes.findIndex((entry) => entry.id === state.modal.id);
            if (index >= 0) draft.travelNotes[index] = updateJournalEntry(draft.travelNotes[index], payload, state.user);
          } else {
            draft.travelNotes.push(createJournalEntry(payload, state.user));
          }
          return draft;
        });
        state.journalDateFilter = payload.noteDate;
        resetJournalPhotoDraft();
        state.modal = null;
        render();
      });
    },
  };
}

function renderDateTabs(trip, dates, activeDate) {
  return `
    <section class="panel span-all expense-day-panel">
      <div class="expense-day-tabs">
        ${dates.map((date) => {
          const day = trip.itineraryDays.find((entry) => entry.date === date);
          const count = (trip.travelNotes || []).filter((entry) => getJournalDate(entry, trip) === date).length;
          return `
            <button class="expense-day-tab ${date === activeDate ? "is-active" : ""}" type="button" data-journal-date-tab="${date}">
              <span>${escapeHtml(day?.title || T.journalDay)}</span>
              <strong>${escapeHtml(date.slice(5))}</strong>
              <em>${count} ${T.count}</em>
            </button>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderJournalEntry(entry) {
  const typeLabel = JOURNAL_TYPES.find((type) => type.id === entry.type)?.label || T.title;
  const time = entry.capturedAt ? entry.capturedAt.replace("T", " ").slice(0, 16) : "";
  const mood = getMood(entry.moodId);
  return `
    <article class="journal-card ${entry.photoUrl ? "has-photo" : ""} ${entry.done ? "is-done" : ""}">
      ${entry.photoUrl ? `<button class="journal-photo-button" type="button" data-journal-photo-view="${entry.id}" aria-label="${T.viewPhoto}"><img class="journal-photo" src="${escapeHtml(entry.photoUrl)}" alt="${escapeHtml(entry.title)}" /></button>` : ""}
      <div class="journal-card-body">
        <div class="journal-card-head">
          <span class="pill">${typeLabel}</span>
          <span>${escapeHtml(time)}</span>
        </div>
        <div class="journal-title-row">
          <h3>${escapeHtml(entry.title)}</h3>
          ${mood ? renderMoodBadge(mood) : ""}
        </div>
        ${entry.body ? `<p>${escapeHtml(entry.body)}</p>` : ""}
        ${entry.tags?.length ? `<div class="meta-row">${entry.tags.map((tag) => `<span class="tag">#${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
        <div class="row-actions">
          ${entry.type === "todo" ? `<button class="action-pill" type="button" data-journal-toggle="${entry.id}">${entry.done ? T.done : T.markDone}</button>` : ""}
          <button class="action-pill" type="button" data-journal-edit="${entry.id}">${T.edit}</button>
          <button class="action-pill danger" type="button" data-journal-delete="${entry.id}">${T.delete}</button>
        </div>
      </div>
    </article>
  `;
}

function renderMoodBadge(mood) {
  return `<span class="mood-badge"><img src="${escapeHtml(mood.iconUrl)}" alt="" /><span>${escapeHtml(mood.label)}</span></span>`;
}

function renderJournalSheet(activeDate, trip) {
  if (state.modal?.type !== "journal") return "";
  const entry = state.modal.mode === "edit" ? trip.travelNotes.find((item) => item.id === state.modal.id) : null;
  const title = entry ? T.editJournal : T.addJournal;
  const type = entry?.type || "photo";
  const capturedAt = toDatetimeLocal(entry?.capturedAt || `${activeDate}T${new Date().toTimeString().slice(0, 5)}`);
  const photoUrl = state.journalPhotoPreviewUrl || state.journalPhotoDraftUrl || entry?.photoUrl || "";

  return `
    <div class="sheet-backdrop">
      <section class="bottom-sheet" role="dialog" aria-modal="true" aria-label="${title}">
        <div class="sheet-head">
          <h2>${title}</h2>
          <button class="action-pill" type="button" data-close-sheet>${T.close}</button>
        </div>
        <form class="form-grid" data-journal-form>
          <div class="form-row">
            <div class="field"><label>${T.type}</label>
              <select class="select" name="type">
                ${JOURNAL_TYPES.map((item) => `<option value="${item.id}" ${item.id === type ? "selected" : ""}>${item.label}</option>`).join("")}
              </select>
            </div>
            <div class="field"><label>${T.day}</label><input class="input" type="date" name="noteDate" value="${escapeHtml(entry?.noteDate || activeDate)}" required /></div>
          </div>
          <div class="field"><label>${T.capturedAt}</label><input class="input" type="datetime-local" name="capturedAt" value="${escapeHtml(capturedAt)}" required /></div>
          <div class="field"><label>${T.entryTitle}</label><input class="input" name="title" value="${escapeHtml(entry?.title || "")}" placeholder="${T.titlePlaceholder}" /></div>
          <div class="field"><label>${T.body}</label><textarea class="textarea" name="body" placeholder="${T.bodyPlaceholder}">${escapeHtml(entry?.body || "")}</textarea></div>
          <div class="field"><label>${T.tags}</label><input class="input" name="tags" value="${escapeHtml((entry?.tags || []).join(" "))}" placeholder="${T.tagsPlaceholder}" /></div>
          <div class="field"><label>${T.mood}</label><select class="select" name="moodId"><option value="">${T.noMood}</option>${TRIP_MOODS.map((mood) => `<option value="${mood.id}" ${entry?.moodId === mood.id ? "selected" : ""}>${escapeHtml(mood.label)}</option>`).join("")}</select></div>
          <div class="field">
            <label>${T.photo}</label>
            ${photoUrl ? `<img class="journal-photo-preview" src="${escapeHtml(photoUrl)}" alt="${T.previewAlt}" />` : ""}
            ${state.journalPhotoUploading ? `<div class="status">${T.uploading}</div>` : ""}
            ${state.journalPhotoError ? `<div class="status danger">${escapeHtml(state.journalPhotoError)}</div>` : ""}
            <input class="input" type="file" accept="image/*" capture="environment" data-journal-photo-input />
          </div>
          <label class="member-chip"><input type="checkbox" name="done" ${entry?.done ? "checked" : ""} /> ${T.done}</label>
          <button class="button primary full" type="submit" ${state.journalPhotoUploading ? "disabled" : ""}>${entry ? T.saveEdit : T.saveAdd}</button>
        </form>
      </section>
    </div>
  `;
}

function renderJournalPhotoViewer(trip) {
  if (state.modal?.type !== "journalPhoto") return "";
  const entry = trip.travelNotes.find((item) => item.id === state.modal.id);
  if (!entry?.photoUrl) return "";

  return `
    <div class="sheet-backdrop">
      <section class="photo-viewer" role="dialog" aria-modal="true" aria-label="${T.photoViewer}">
        <div class="sheet-head">
          <h2>${escapeHtml(entry.title || T.photoViewer)}</h2>
          <button class="action-pill" type="button" data-close-sheet>${T.close}</button>
        </div>
        <img class="journal-photo-full" src="${escapeHtml(entry.photoUrl)}" alt="${escapeHtml(entry.title || T.photo)}" />
        ${entry.body ? `<p>${escapeHtml(entry.body)}</p>` : ""}
      </section>
    </div>
  `;
}

function resetJournalPhotoDraft() {
  state.journalPhotoDraftUrl = "";
  state.journalPhotoPreviewUrl = "";
  state.journalPhotoDraftPath = "";
  state.journalPhotoDraftProvider = "";
  state.journalPhotoDraftId = "";
  state.journalPhotoUploading = false;
  state.journalPhotoError = "";
}

function setJournalPhotoDraft(entry) {
  state.journalPhotoDraftUrl = entry?.photoUrl || "";
  state.journalPhotoPreviewUrl = entry?.photoUrl || "";
  state.journalPhotoDraftPath = entry?.photoPath || "";
  state.journalPhotoDraftProvider = entry?.photoProvider || "";
  state.journalPhotoDraftId = entry?.id || "";
  state.journalPhotoUploading = false;
  state.journalPhotoError = "";
}

function cameraIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M4 8h3l1.5-2h7L17 8h3v11H4V8Z"/><circle cx="12" cy="13.5" r="3.5"/></svg>`;
}

function toDatetimeLocal(value) {
  return String(value || "").slice(0, 16);
}

