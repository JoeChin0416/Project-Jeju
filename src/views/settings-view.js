import { clearAiKey, getAiKey, setAiKey, testAiKey } from "../services/ai.js";
import {
  addGoogleWhitelistEmail,
  canManageAccess,
  removeGoogleWhitelistEmail,
  saveAccessSettings,
} from "../services/access-control.js?v=20260604-qa-weather-ocr";
import { hasFirebaseConfig } from "../services/firebase.js";
import { setUiStyle, state } from "../state/app-state.js";
import { updateActiveTrip } from "../state/trip-store.js?v=20260604-qa-weather-ocr";
import { escapeHtml, formToObject } from "../utils/dom.js";

const text = {
  settings: "\u8a2d\u5b9a",
  settingsHelp:
    "\u7ba1\u7406\u767b\u51fa\u3001API Key\u3001\u65c5\u884c\u8cc7\u8a0a\u3001Google \u767b\u5165\u767d\u540d\u55ae\u8207\u4ecb\u9762\u98a8\u683c\u3002",
  firebase: "Firebase",
  configured: "\u5df2\u8a2d\u5b9a",
  demoStore: "\u672a\u8a2d\u5b9a\uff0c\u4f7f\u7528 demo store",
  localSaved: "\u5df2\u5132\u5b58\u65bc\u672c\u6a5f\u700f\u89bd\u5668",
  notSet: "\u5c1a\u672a\u8a2d\u5b9a",
  signOut: "\u767b\u51fa",
  tripData: "\u65c5\u884c\u8cc7\u6599",
  tripName: "\u65c5\u884c\u540d\u7a31",
  destination: "\u76ee\u7684\u5730",
  start: "\u958b\u59cb",
  end: "\u7d50\u675f",
  saveTrip: "\u5132\u5b58\u65c5\u884c\u8cc7\u6599",
  savedTrip: "\u65c5\u884c\u8cc7\u6599\u5df2\u5132\u5b58\u3002",
  save: "\u5132\u5b58",
  clear: "\u6e05\u9664",
  aiSaved: "AI API Key \u5df2\u5132\u5b58\u3002",
  aiCleared: "AI API Key \u5df2\u6e05\u9664\u3002",
  whitelist: "Google \u767d\u540d\u55ae",
  whitelistHelp:
    "Email \u767b\u5165\u4e0d\u53d7\u9650\u5236\uff1bGoogle \u767b\u5165\u624d\u6703\u5957\u7528\u767d\u540d\u55ae\u3002",
  whitelistNoAccess:
    "\u8acb\u7528 Email \u767b\u5165\u7ba1\u7406 Google \u767d\u540d\u55ae\u3002",
  addWhitelist: "\u52a0\u5165\u767d\u540d\u55ae",
  remove: "\u522a\u9664",
  whitelistEmpty:
    "\u76ee\u524d\u6c92\u6709\u767d\u540d\u55ae\uff0c\u4ee3\u8868\u6240\u6709 Google \u5e33\u865f\u90fd\u53ef\u4ee5\u767b\u5165\u3002",
  whitelistUpdated: "\u767d\u540d\u55ae\u5df2\u66f4\u65b0\u3002",
  uiStyle: "\u4ecb\u9762\u98a8\u683c",
  styleHelp:
    "\u98a8\u683c1\u4fdd\u7559\u539f\u672c\u5de5\u5177\u611f\uff1b\u98a8\u683c2\u662f\u97d3\u7cfb\u65c5\u62cd\uff1b\u98a8\u683c3\u662f\u6d77\u5cf6\u7968\u5238\u98a8\u3002\u4e09\u7a2e\u90fd\u4ee5\u7d04 480px \u624b\u6a5f App \u5bec\u5ea6\u70ba\u4e3b\u3002",
  style1: "\u98a8\u683c1",
  style1Desc: "\u539f\u672c\u6e05\u723d\u5de5\u5177\u98a8",
  style2: "\u98a8\u683c2",
  style2Desc: "\u97d3\u7cfb\u6fdf\u5dde\u65c5\u62cd\u98a8",
  style3: "\u98a8\u683c3",
  style3Desc: "\u6d77\u5cf6\u7968\u5238\u98a8",
  styleChanged: "\u4ecb\u9762\u98a8\u683c\u5df2\u5207\u63db\u3002",
};

export function settingsView(trip, render) {
  const aiKey = getAiKey();
  const accessSettings = state.accessSettings ?? { googleWhitelist: [] };
  const accessManageable = canManageAccess(state.user);
  return {
    html: `
      <section class="panel span-all settings-hero-panel">
        <div class="section-title"><div><h2>${text.settings}</h2><p>${text.settingsHelp}</p></div></div>
        <div class="list">
          <div class="status ${hasFirebaseConfig() ? "" : "danger"}">${text.firebase}: ${hasFirebaseConfig() ? text.configured : text.demoStore}</div>
          <div class="status">AI API Key: ${aiKey ? text.localSaved : text.notSet}</div>
          <button class="button ghost full" type="button" data-sign-out-settings>${text.signOut}</button>
        </div>
      </section>
      <section class="panel span-all">
        <div class="section-title"><div><h2>${text.uiStyle}</h2><p>${text.styleHelp}</p></div></div>
        <div class="style-switcher" role="group" aria-label="${text.uiStyle}">
          ${renderStyleOption("style1", text.style1, text.style1Desc)}
          ${renderStyleOption("style2", text.style2, text.style2Desc)}
          ${renderStyleOption("style3", text.style3, text.style3Desc)}
        </div>
      </section>
      <section class="panel span-all">
        <div class="section-title"><h2>${text.tripData}</h2></div>
        <form class="form-grid" data-trip-form>
          <div class="field"><label>${text.tripName}</label><input class="input" name="name" value="${escapeHtml(trip.name)}" /></div>
          <div class="field"><label>${text.destination}</label><input class="input" name="destination" value="${escapeHtml(trip.destination)}" /></div>
          <div class="form-row">
            <div class="field"><label>${text.start}</label><input class="input" type="date" name="startDate" value="${escapeHtml(trip.startDate)}" /></div>
            <div class="field"><label>${text.end}</label><input class="input" type="date" name="endDate" value="${escapeHtml(trip.endDate)}" /></div>
          </div>
          <button class="button primary full">${text.saveTrip}</button>
        </form>
      </section>
      <section class="panel span-all">
        <div class="section-title"><h2>AI API Key</h2></div>
        <form class="form-grid" data-ai-key-form>
          <div class="field"><label>Gemini API Key</label><input class="input" name="aiKey" type="password" value="${escapeHtml(aiKey)}" autocomplete="off" /></div>
          <div class="form-row"><button class="button primary" type="submit">${text.save}</button><button class="button ghost" type="button" data-clear-ai-key>${text.clear}</button></div>
        </form>
      </section>
      <section class="panel span-all">
        <div class="section-title"><div><h2>${text.whitelist}</h2><p>${text.whitelistHelp}</p></div></div>
        ${accessManageable ? renderWhitelist(accessSettings) : `<div class="status">${text.whitelistNoAccess}</div>`}
      </section>
    `,
    bind(root) {
      root.querySelectorAll("[data-style-option]").forEach((button) => {
        button.addEventListener("click", () => {
          setUiStyle(button.dataset.styleOption);
          state.notice = text.styleChanged;
          render();
        });
      });
      root.querySelector("[data-trip-form]")?.addEventListener("submit", (event) => {
        event.preventDefault();
        const data = formToObject(event.currentTarget);
        state.store = updateActiveTrip(state.store, (draft) => ({ ...draft, ...data }));
        state.notice = text.savedTrip;
        render();
      });
      root.querySelector("[data-ai-key-form]")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
          setAiKey(new FormData(event.currentTarget).get("aiKey") || "");
          await testAiKey();
          state.notice = text.aiSaved;
        } catch (error) {
          state.error = error.message;
        }
        render();
      });
      root.querySelector("[data-clear-ai-key]")?.addEventListener("click", () => {
        clearAiKey();
        state.notice = text.aiCleared;
        render();
      });
      root.querySelector("[data-whitelist-form]")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
          state.accessSettings = await saveAccessSettings(
            addGoogleWhitelistEmail(accessSettings, new FormData(event.currentTarget).get("email")),
          );
          state.notice = text.whitelistUpdated;
        } catch (error) {
          state.error = error.message;
        }
        render();
      });
      root.addEventListener("click", async (event) => {
        const email = event.target.closest("[data-remove-whitelist]")?.dataset.removeWhitelist;
        if (!email) return;
        state.accessSettings = await saveAccessSettings(removeGoogleWhitelistEmail(accessSettings, email));
        state.notice = text.whitelistUpdated;
        render();
      });
    },
  };
}

function renderStyleOption(id, label, description) {
  const active = state.uiStyle === id;
  return `
    <button class="style-option ${active ? "is-active" : ""}" type="button" data-style-option="${id}">
      <span>${label}</span>
      <small>${description}</small>
    </button>
  `;
}

function renderWhitelist(settings) {
  return `
    <form class="form-grid" data-whitelist-form>
      <div class="field"><label>Email</label><input class="input" name="email" type="email" placeholder="friend@gmail.com" /></div>
      <button class="button secondary" type="submit">${text.addWhitelist}</button>
    </form>
    <div class="list" style="margin-top:12px">
      ${
        (settings.googleWhitelist || [])
          .map(
            (email) =>
              `<div class="card packing-row"><span>${escapeHtml(email)}</span><button class="action-pill danger" data-remove-whitelist="${escapeHtml(email)}">${text.remove}</button></div>`,
          )
          .join("") || `<div class="empty">${text.whitelistEmpty}</div>`
      }
    </div>
  `;
}

