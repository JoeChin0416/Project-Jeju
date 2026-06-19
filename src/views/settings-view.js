import {
  addGoogleWhitelistEmail,
  canManageAccess,
  removeAccessEmail,
  removeGoogleWhitelistEmail,
  saveAccessSettings,
  syncMemberEmails,
} from "../services/access-control.js?v=20260604-qa-weather-ocr";
import { clearAiKey, getAiKey, setAiKey, testAiKey } from "../services/ai.js";
import { hasFirebaseConfig } from "../services/firebase.js";
import {
  createManualMember,
  createMemberForUser,
  findMemberForUser,
  isOwnerEmail,
  isValidEmail,
  normalizeEmail,
  removeMemberFromTrip,
  upsertMember,
} from "../features/members.js";
import { AVATAR_PRESETS, getAvatarPreset, isCustomAvatarUrl, resolveAvatarUrl } from "../features/avatar-presets.js?v=20260604-qa-weather-ocr";
import { setUiStyle, state } from "../state/app-state.js";
import { updateActiveTrip } from "../state/trip-store.js?v=20260604-qa-weather-ocr";
import { escapeHtml, formToObject } from "../utils/dom.js";
import { fileToCompressedDataUrl } from "../utils/image.js?v=20260604-qa-weather-ocr";

const text = {
  settings: "設定",
  settingsHelp: "管理登入權限、旅伴角色、旅行資料、AI API Key 與畫面風格。",
  firebase: "Firebase",
  configured: "已連線",
  demoStore: "未設定，使用 demo store",
  localSaved: "已儲存在本機瀏覽器",
  notSet: "尚未設定",
  signOut: "登出",
  members: "旅伴角色",
  memberHelp: "記帳付款人、分帳對象與成員支出都會使用這份名單。",
  roleRequired: "請先建立你的旅伴角色。建立後才會出現在記帳與分帳名單中。",
  myRole: "我的角色",
  createMyRole: "建立我的角色",
  updateMyRole: "更新我的角色",
  avatar: "角色照片",
  presetAvatar: "預設頭像",
  uploadAvatar: "上傳照片",
  previewAvatar: "預覽頭像",
  close: "關閉",
  addMember: "新增旅伴",
  memberName: "名稱",
  memberEmail: "Email",
  memberUid: "登入 UID",
  noMembers: "目前沒有旅伴角色。第一位登入者請先建立自己的角色。",
  memberSaved: "旅伴角色已儲存。",
  memberDeleted: "旅伴角色已刪除。",
  edit: "編輯",
  deleteAccount: "刪除帳號",
  cannotDeleteOwner: "主要管理者不能在 App 內刪除。",
  invalidEmail: "請輸入有效的 Email。",
  editNamePrompt: "請輸入旅伴名稱",
  editEmailPrompt: "請輸入 Email",
  deleteConfirm1: "這會刪除旅伴角色，也會從分帳名單移除。確定要繼續？",
  deleteConfirm2: "再次確認：這個動作會影響既有記帳的付款人與分帳對象。",
  deleteTypePrompt: "請輸入旅伴名稱以確認刪除",
  you: "你",
  noEmail: "未填 Email",
  manual: "手動新增",
  tripData: "旅行資料",
  tripName: "旅行名稱",
  destination: "目的地",
  start: "開始日期",
  end: "結束日期",
  dailyBudget: "每日總預算（TWD）",
  saveTrip: "儲存旅行資料",
  savedTrip: "旅行資料已儲存。",
  save: "儲存",
  clear: "清除",
  aiSaved: "AI API Key 已儲存。",
  aiCleared: "AI API Key 已清除。",
  whitelist: "Google 登入白名單",
  whitelistHelp: "Google 第一次登入需要先允許 Firebase Auth 建立使用者；實際可否讀寫由這裡與安全規則控管。",
  whitelistNoAccess: "只有主要管理者或管理員可以修改 Google 白名單。",
  addWhitelist: "加入白名單",
  remove: "移除",
  whitelistEmpty: "目前沒有白名單。主要管理者仍可使用 Google 登入。",
  whitelistUpdated: "白名單已更新。",
  uiStyle: "風格樣式",
  styleHelp: "保留原本風格，並可切換韓系旅行感與海島票券風。",
  style1: "風格1",
  style1Desc: "原本清爽工具感",
  style2: "風格2",
  style2Desc: "韓系粉色旅行感",
  style3: "風格3",
  style3Desc: "海島票券風",
  styleChanged: "風格已切換。",
};

export function settingsView(trip, render) {
  const aiKey = getAiKey();
  const accessSettings = state.accessSettings ?? { googleWhitelist: [], memberEmails: [], adminEmails: [] };
  const accessManageable = canManageAccess(state.user, accessSettings);
  const currentMember = findMemberForUser(trip.members, state.user);

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
        <div class="section-title"><div><h2>${text.members}</h2><p>${text.memberHelp}</p></div></div>
        ${!currentMember ? `<div class="status danger">${text.roleRequired}</div>` : ""}
        ${renderMyRoleForm(currentMember)}
        ${renderMemberList(trip, currentMember)}
        ${renderManualMemberForm()}
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
          <div class="field"><label>${text.dailyBudget}</label><input class="input" name="dailyBudgetBase" inputmode="decimal" value="${escapeHtml(trip.dailyBudgetBase || "")}" /></div>
          <button class="button primary full" type="submit">${text.saveTrip}</button>
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
      ${renderAvatarPreviewModal()}
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
        state.store = updateActiveTrip(state.store, (draft) => ({
          ...draft,
          ...data,
          dailyBudgetBase: Number(data.dailyBudgetBase || 0),
        }));
        state.notice = text.savedTrip;
        render();
      });

      root.querySelector("[data-my-role-form]")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = formToObject(event.currentTarget);
        await runMemberUpdate(render, async () => saveMemberUpdate({
          accessSettings,
          updater(draft) {
            const nextMember = createMemberForUser(
              state.user,
              {
                ...currentMember,
                name: data.name,
                avatarPresetId: data.avatarPresetId,
                avatarUrl: data.avatarUrl,
              },
              draft.members.length,
            );
            draft.members = upsertMember(draft.members, nextMember);
            return draft.members;
          },
        }));
      });

      root.querySelector("[data-avatar-upload]")?.addEventListener("change", async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
          const dataUrl = await fileToCompressedDataUrl(file, { maxSize: 420, quality: 0.78 });
          setAvatarDraft(root, { avatarUrl: dataUrl, avatarPresetId: "" });
        } catch (error) {
          state.error = error.message;
          render();
        }
      });

      root.querySelector("[data-manual-member-form]")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = formToObject(event.currentTarget);
        await runMemberUpdate(render, async () => {
          if (!isValidEmail(data.email)) throw new Error(text.invalidEmail);
          await saveMemberUpdate({
            accessSettings,
            updater(draft) {
              const member = createManualMember(data, draft.members.length);
              draft.members = upsertMember(draft.members, member);
              return draft.members;
            },
          });
        });
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
        if (event.target.matches("[data-close-avatar-preview]") || event.target.closest("[data-close-avatar-preview-button]")) {
          state.modal = null;
          render();
          return;
        }

        const avatarPreviewButton = event.target.closest("[data-avatar-preview-button]");
        if (avatarPreviewButton) {
          const image = avatarPreviewButton.querySelector("img");
          if (!image?.src) return;
          state.modal = {
            type: "avatar-preview",
            url: image.src,
            label: avatarPreviewButton.dataset.avatarLabel || text.previewAvatar,
          };
          render();
          return;
        }

        const avatarPresetId = event.target.closest("[data-avatar-preset]")?.dataset.avatarPreset;
        if (avatarPresetId) {
          setAvatarDraft(root, { avatarPresetId, avatarUrl: "" });
          return;
        }

        const email = event.target.closest("[data-remove-whitelist]")?.dataset.removeWhitelist;
        if (email) {
          await runMemberUpdate(render, async () => {
            state.accessSettings = await saveAccessSettings(removeGoogleWhitelistEmail(accessSettings, email));
            state.notice = text.whitelistUpdated;
          });
          return;
        }

        const editMemberId = event.target.closest("[data-edit-member]")?.dataset.editMember;
        if (editMemberId) {
          const member = trip.members.find((entry) => entry.id === editMemberId);
          if (!member) return;
          const name = window.prompt(text.editNamePrompt, member.name);
          if (!name) return;
          const emailValue = window.prompt(text.editEmailPrompt, member.email || "");
          if (!isValidEmail(emailValue)) {
            state.error = text.invalidEmail;
            render();
            return;
          }
          await runMemberUpdate(render, async () => saveMemberUpdate({
            accessSettings,
            updater(draft) {
              draft.members = upsertMember(draft.members, { ...member, name: name.trim(), email: normalizeEmail(emailValue) });
              return draft.members;
            },
          }));
          return;
        }

        const deleteMemberId = event.target.closest("[data-delete-member]")?.dataset.deleteMember;
        if (deleteMemberId) {
          const member = trip.members.find((entry) => entry.id === deleteMemberId);
          if (!member) return;
          if (isOwnerEmail(member.email)) {
            state.error = text.cannotDeleteOwner;
            render();
            return;
          }
          if (!window.confirm(`${text.deleteConfirm1}\n\n${member.name}`)) return;
          if (!window.confirm(text.deleteConfirm2)) return;
          if (window.prompt(`${text.deleteTypePrompt}: ${member.name}`) !== member.name) return;

          await runMemberUpdate(render, async () => {
            let nextMembers = [];
            state.store = updateActiveTrip(state.store, (draft) => {
              const nextTrip = removeMemberFromTrip(draft, deleteMemberId);
              nextMembers = nextTrip.members;
              return nextTrip;
            });
            state.accessSettings = await saveAccessSettings(removeAccessEmail(syncMemberEmails(accessSettings, nextMembers), member.email));
            state.notice = text.memberDeleted;
          });
        }
      });
    },
  };
}

async function runMemberUpdate(render, action) {
  try {
    await action();
  } catch (error) {
    state.error = error.message;
  }
  render();
}

async function saveMemberUpdate({ accessSettings, updater }) {
  let nextMembers = [];
  state.store = updateActiveTrip(state.store, (draft) => {
    nextMembers = updater(draft);
    return draft;
  });
  state.accessSettings = await saveAccessSettings(syncMemberEmails(accessSettings, nextMembers));
  state.notice = text.memberSaved;
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

function renderMyRoleForm(member) {
  const avatarDraft = getAvatarDraft(member);
  return `
    <form class="form-grid member-role-form" data-my-role-form>
      <div class="avatar-editor">
        <button class="avatar-preview-button" type="button" data-avatar-preview-button data-avatar-label="${escapeHtml(text.myRole)}">
          <img class="member-avatar large" src="${escapeHtml(avatarDraft.previewUrl)}" alt="${text.avatar}" data-my-avatar-preview />
        </button>
        <div class="form-grid">
          <div class="field">
            <label>${text.presetAvatar}</label>
            <div class="avatar-preset-grid">
              ${AVATAR_PRESETS.map((avatar) => `
                <button class="avatar-preset ${avatar.id === avatarDraft.avatarPresetId ? "is-active" : ""}" type="button" data-avatar-preset="${escapeHtml(avatar.id)}" title="${escapeHtml(avatar.label)}">
                  <img src="${escapeHtml(avatar.url)}" alt="${escapeHtml(avatar.label)}" />
                </button>
              `).join("")}
            </div>
          </div>
          <label class="button ghost full" for="member-avatar-upload">${text.uploadAvatar}</label>
          <input id="member-avatar-upload" class="visually-hidden" type="file" accept="image/*" data-avatar-upload />
        </div>
      </div>
      <input type="hidden" name="avatarPresetId" value="${escapeHtml(avatarDraft.avatarPresetId)}" data-avatar-preset-field />
      <input type="hidden" name="avatarUrl" value="${escapeHtml(avatarDraft.avatarUrl)}" data-avatar-url-field />
      <div class="field">
        <label>${text.myRole}</label>
        <input class="input" name="name" value="${escapeHtml(member?.name || state.user?.displayName || state.user?.email?.split("@")[0] || "")}" required />
      </div>
      <button class="button primary full" type="submit">${member ? text.updateMyRole : text.createMyRole}</button>
    </form>
  `;
}

function renderManualMemberForm() {
  return `
    <form class="form-grid member-role-form" data-manual-member-form>
      <div class="form-row">
        <div class="field"><label>${text.memberName}</label><input class="input" name="name" required /></div>
        <div class="field"><label>${text.memberEmail}</label><input class="input" name="email" type="email" required /></div>
      </div>
      <button class="button secondary full" type="submit">${text.addMember}</button>
    </form>
  `;
}

function renderMemberList(trip, currentMember) {
  const members = [...(trip.members || [])].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  if (!members.length) return `<div class="empty">${text.noMembers}</div>`;
  return `
    <div class="list member-role-list">
      ${members.map((member) => `
        <article class="card member-role-card" style="--member-color:${escapeHtml(member.color || "#116b63")}">
          <span class="member-color-bar"></span>
          <button class="avatar-preview-button" type="button" data-avatar-preview-button data-avatar-label="${escapeHtml(member.name)}">
            <img class="member-avatar" src="${escapeHtml(resolveMemberAvatarUrl(member))}" alt="" />
          </button>
          <div class="member-role-copy">
            <h3>${escapeHtml(member.name)} ${member.id === currentMember?.id ? `<small>${text.you}</small>` : ""}</h3>
            <p>${escapeHtml(member.email || text.noEmail)}</p>
            <small>${text.memberUid}: ${escapeHtml(member.uid || text.manual)}</small>
          </div>
          <div class="row-actions">
            <button class="action-pill" type="button" data-edit-member="${escapeHtml(member.id)}">${text.edit}</button>
            <button class="action-pill danger" type="button" data-delete-member="${escapeHtml(member.id)}">${text.deleteAccount}</button>
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function renderAvatarPreviewModal() {
  if (state.modal?.type !== "avatar-preview") return "";
  return `
    <div class="sheet-backdrop avatar-preview-backdrop" data-close-avatar-preview>
      <section class="avatar-preview-modal" role="dialog" aria-label="${escapeHtml(state.modal.label || text.previewAvatar)}">
        <div class="sheet-head">
          <h2>${escapeHtml(state.modal.label || text.previewAvatar)}</h2>
          <button class="action-pill" type="button" data-close-avatar-preview-button>${text.close}</button>
        </div>
        <img class="avatar-preview-image" src="${escapeHtml(state.modal.url)}" alt="${escapeHtml(state.modal.label || text.previewAvatar)}" />
      </section>
    </div>
  `;
}

function getAvatarDraft(member) {
  const avatarPresetId = member?.avatarPresetId || AVATAR_PRESETS[0].id;
  const presetUrl = getAvatarPreset(avatarPresetId).url;
  const avatarUrl = isCustomAvatarUrl(member?.avatarUrl) && member.avatarUrl !== presetUrl ? member.avatarUrl : "";
  return {
    avatarPresetId,
    avatarUrl,
    previewUrl: avatarUrl || presetUrl,
  };
}

function resolveMemberAvatarUrl(member) {
  return resolveAvatarUrl(member?.avatarPresetId, member?.avatarUrl);
}

function setAvatarDraft(root, { avatarPresetId, avatarUrl }) {
  const presetField = root.querySelector("[data-avatar-preset-field]");
  const urlField = root.querySelector("[data-avatar-url-field]");
  const preview = root.querySelector("[data-my-avatar-preview]");
  if (presetField) presetField.value = avatarPresetId || "";
  if (urlField) urlField.value = avatarUrl || "";
  if (preview) preview.src = avatarUrl || getAvatarPreset(avatarPresetId).url;
  root.querySelectorAll("[data-avatar-preset]").forEach((button) => {
    button.classList.toggle("is-active", Boolean(avatarPresetId) && button.dataset.avatarPreset === avatarPresetId);
  });
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
              `<div class="card packing-row"><span>${escapeHtml(email)}</span><button class="action-pill danger" type="button" data-remove-whitelist="${escapeHtml(email)}">${text.remove}</button></div>`,
          )
          .join("") || `<div class="empty">${text.whitelistEmpty}</div>`
      }
    </div>
  `;
}
