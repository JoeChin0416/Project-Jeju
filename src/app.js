import { getInitialUser, signInWithEmail, signInWithGoogle, signOutUser } from "./services/auth.js?v=20260604-qa-weather-ocr";
import { checkUserAccess, loadAccessSettings } from "./services/access-control.js?v=20260604-qa-weather-ocr";
import { findMemberForUser } from "./features/members.js";
import { hasFirebaseConfig, initializeFirebaseRuntime } from "./services/firebase.js";
import { getActiveTrip, readTabFromHash, setActiveTab, setState, state } from "./state/app-state.js";
import {
  getStoreSyncWarning,
  loadStoreForUser,
  startSharedStoreSubscription,
  stopSharedStoreSubscription,
} from "./state/trip-store.js?v=20260604-qa-weather-ocr";
import { bindImageInput, cameraView } from "./views/camera-view.js?v=20260604-qa-weather-ocr";
import { expensesView } from "./views/expenses-view.js?v=20260604-qa-weather-ocr";
import { itineraryView } from "./views/itinerary-view.js?v=20260604-qa-weather-ocr";
import { journalView } from "./views/journal-view.js?v=20260604-qa-weather-ocr";
import { packingView } from "./views/packing-view.js?v=20260604-qa-weather-ocr";
import { settingsView } from "./views/settings-view.js?v=20260604-qa-weather-ocr";
import { escapeHtml } from "./utils/dom.js";

const text = {
  loading: "\u8f09\u5165\u4e2d...",
  noTrip: "\u627e\u4e0d\u5230\u65c5\u884c\u8cc7\u6599",
  newTrip: "\u65b0\u7684\u65c5\u884c",
  settings: "\u8a2d\u5b9a",
  authTitle: "\u65c5\u884c\u5de5\u5177\u7bb1",
  authSubtitle: "\u884c\u7a0b\u3001OCR \u8a18\u5e33\u3001\u5206\u5e33\u8207\u65c5\u884c\u6e05\u55ae\u96c6\u4e2d\u7ba1\u7406\u3002",
  firebaseMissing: "\u5c1a\u672a\u8a2d\u5b9a Firebase config\uff0c\u76ee\u524d\u4f7f\u7528 demo \u6a21\u5f0f\u3002",
  password: "\u5bc6\u78bc",
  emailLogin: "Email \u767b\u5165",
  googleLogin: "Google \u767b\u5165",
  googleCancelled: "Google \u767b\u5165\u5c1a\u672a\u5b8c\u6210\uff0c\u8acb\u518d\u8a66\u4e00\u6b21 Google \u767b\u5165\u3002",
  demoLogout:
    "Demo \u6a21\u5f0f\u4e0d\u6703\u771f\u6b63\u767b\u51fa\uff0c\u82e5\u8981\u4f7f\u7528\u767b\u51fa\u8acb\u8a2d\u5b9a Firebase Auth\u3002",
  destinationUnset: "\u672a\u8a2d\u5b9a\u76ee\u7684\u5730",
  dateUnset: "\u672a\u8a2d\u5b9a\u65e5\u671f",
  navLabel: "\u5e95\u90e8\u5c0e\u89bd",
  itinerary: "\u884c\u7a0b",
  packing: "\u884c\u674e",
  camera: "\u76f8\u6a5f",
  expenses: "\u8a18\u5e33",
  journal: "\u65c5\u8a18",
};

const app = document.querySelector("#app");
if (app) app.innerHTML = loadingShell();

await boot();

async function boot() {
  state.activeTab = readTabFromHash();
  setState({ loading: true });
  render();

  try {
    await initializeFirebaseRuntime();
    const user = await getInitialUser();
    const session = await createSession(user);
    setState({ ...session, loading: false });
    await startSharedStoreSubscription(session.user, (nextStore) => {
      if (!state.user || state.loading) return;
      state.store = nextStore;
      render();
    });
  } catch (error) {
    setState({ error: error.message, loading: false });
  }

  window.addEventListener("hashchange", () => {
    state.activeTab = readTabFromHash();
    render();
  });
  bindImageInput(render);
  render();
}

function render() {
  applyUiStyle();

  if (state.loading && !state.store) {
    app.innerHTML = loadingShell();
    return;
  }

  if (!state.user) {
    renderAuth();
    return;
  }

  const trip = getActiveTrip();
  if (!trip) {
    app.innerHTML = `<main class="auth-shell"><section class="panel auth-card"><div class="status danger">${text.noTrip}</div></section></main>`;
    return;
  }

  if (state.user && !findMemberForUser(trip.members, state.user) && state.activeTab !== "settings") {
    state.activeTab = "settings";
    if (location.hash !== "#/settings") history.replaceState(null, "", "#/settings");
    if (!state.notice) state.notice = "請先建立你的旅伴角色。";
  }

  const view = getView(trip);
  app.innerHTML = `
    <main class="app-shell">
      <div class="app-frame">
        <header class="topbar">
          <div class="brand-block">
            <h1 class="trip-title">${escapeHtml(trip.name || text.newTrip)}</h1>
          </div>
          <button class="icon-button ${state.activeTab === "settings" ? "is-active" : ""}" title="${text.settings}" data-open-settings>${icon("settings")}</button>
        </header>
        ${state.error ? `<div class="status danger span-all" data-message>${escapeHtml(state.error)}</div>` : ""}
        ${state.notice ? `<div class="status span-all" data-message>${escapeHtml(state.notice)}</div>` : ""}
        <div class="view-outlet" id="view-outlet">${view.html}</div>
      </div>
    </main>
    ${renderBottomNav()}
  `;

  document.querySelector("[data-open-settings]")?.addEventListener("click", () => setActiveTab("settings"));
  document.querySelectorAll("[data-nav-tab]").forEach((button) => {
    button.addEventListener("click", () => setActiveTab(button.dataset.navTab));
  });

  const outlet = document.querySelector("#view-outlet");
  view.bind?.(outlet);
  outlet.querySelector("[data-sign-out-settings]")?.addEventListener("click", handleSignOut);

  if (state.error || state.notice) {
    setTimeout(() => {
      state.error = "";
      state.notice = "";
      document.querySelector("[data-message]")?.remove();
    }, 4200);
  }
}

async function handleSignOut() {
  stopSharedStoreSubscription();
  await signOutUser();
  setState({
    user: hasFirebaseConfig() ? null : state.user,
    notice: hasFirebaseConfig() ? "" : text.demoLogout,
  });
  render();
}

function renderAuth() {
  app.innerHTML = `
    <main class="auth-shell">
      <section class="panel auth-card">
        <span class="brand-mark"><span class="brand-dot"></span>Project Jeju</span>
        <h1 class="trip-title">${text.authTitle}</h1>
        <p class="trip-subtitle">${text.authSubtitle}</p>
        ${!hasFirebaseConfig() ? `<div class="status danger" style="margin:14px 0">${text.firebaseMissing}</div>` : ""}
        ${state.error ? `<div class="status danger" style="margin:14px 0">${escapeHtml(state.error)}</div>` : ""}
        ${state.notice ? `<div class="status" style="margin:14px 0">${escapeHtml(state.notice)}</div>` : ""}
        <form class="form-grid" data-auth-form style="margin-top:18px">
          <div class="field"><label>Email</label><input class="input" type="email" name="email" autocomplete="email" required /></div>
          <div class="field"><label>${text.password}</label><input class="input" type="password" name="password" autocomplete="current-password" required /></div>
          <button class="button primary full" type="submit">${text.emailLogin}</button>
          <button class="button secondary full" type="button" data-google-login>${text.googleLogin}</button>
        </form>
      </section>
    </main>
  `;

  document.querySelector("[data-auth-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await completeLogin(() => signInWithEmail(form.get("email"), form.get("password")));
  });
  document.querySelector("[data-google-login]").addEventListener("click", () => completeLogin(signInWithGoogle));
}

async function completeLogin(login) {
  try {
    setState({ error: "", notice: "" });
    const loginPromise = Promise.resolve(login());
    setState({ loading: true });
    render();
    const user = await loginPromise;
    if (!user) {
      setState({ loading: false, notice: text.googleCancelled });
      render();
      return;
    }
    const session = await createSession(user);
    setState({ ...session, loading: false });
    await startSharedStoreSubscription(session.user, (nextStore) => {
      if (!state.user || state.loading) return;
      state.store = nextStore;
      render();
    });
  } catch (error) {
    setState({ error: error.message, loading: false });
  }
  render();
}

async function createSession(user) {
  if (!user) return { user: null, store: null, accessSettings: null, error: "", notice: "" };

  const accessSettings = await loadAccessSettings(user);
  const access = checkUserAccess(user, accessSettings);
  if (!access.allowed) {
    await signOutUser();
    return { user: null, store: null, accessSettings, error: access.reason, notice: "" };
  }

  const store = await loadStoreForUser(user);
  return { user, store, accessSettings, error: "", notice: getStoreSyncWarning() };
}

function getView(trip) {
  const views = {
    itinerary: itineraryView,
    packing: packingView,
    camera: cameraView,
    expenses: expensesView,
    journal: journalView,
    settings: settingsView,
  };
  return (views[state.activeTab] ?? itineraryView)(trip, render);
}

function renderBottomNav() {
  const tabs = [
    ["itinerary", text.itinerary, "map"],
    ["packing", text.packing, "bag"],
    ["camera", text.camera, "camera"],
    ["expenses", text.expenses, "wallet"],
    ["journal", text.journal, "journal"],
  ];

  return `
    <nav class="bottom-nav" aria-label="${text.navLabel}">
      <div class="bottom-nav-inner">
        ${tabs.map(([id, label, iconName]) => {
          const isCamera = id === "camera";
          return `
            <button class="nav-button ${isCamera ? "camera-tab" : ""} ${state.activeTab === id ? "is-active" : ""}" data-nav-tab="${id}" type="button">
              ${isCamera ? `<span class="camera-bump">${icon(iconName)}</span>` : icon(iconName)}
              <span>${label}</span>
            </button>
          `;
        }).join("")}
      </div>
    </nav>
  `;
}

function icon(name) {
  const icons = {
    map: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z"/><path d="M9 3v15M15 6v15"/></svg>`,
    bag: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 7h12l1 14H5L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>`,
    camera: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.8l1.2-1.8h5L15.7 6h1.8A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z"/><circle cx="12" cy="12.5" r="3.5"/></svg>`,
    wallet: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H19v14H6.5A2.5 2.5 0 0 1 4 16.5v-9Z"/><path d="M16 12h4"/><path d="M7 5V3h10v2"/></svg>`,
    journal: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H19v18H7.5A2.5 2.5 0 0 0 5 22V4.5Z"/><path d="M8 6h8M8 10h7"/><path d="m9 15 2 2 4-5"/></svg>`,
    settings: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><defs><linearGradient id="settings-cute-fill" x1="5" x2="19" y1="4" y2="20"><stop stop-color="#c9b5ff"/><stop offset=".52" stop-color="#ffa5bd"/><stop offset="1" stop-color="#8ee3d1"/></linearGradient></defs><path fill="url(#settings-cute-fill)" d="M10.8 2.8h2.4l.5 2c.6.2 1.2.4 1.7.7l1.8-1 1.7 1.7-1 1.8c.3.5.6 1.1.7 1.7l2 .5v2.4l-2 .5a7 7 0 0 1-.7 1.7l1 1.8-1.7 1.7-1.8-1a7 7 0 0 1-1.7.7l-.5 2h-2.4l-.5-2a7 7 0 0 1-1.7-.7l-1.8 1-1.7-1.7 1-1.8a7 7 0 0 1-.7-1.7l-2-.5v-2.4l2-.5c.2-.6.4-1.2.7-1.7l-1-1.8 1.7-1.7 1.8 1c.5-.3 1.1-.6 1.7-.7l.5-2Z"/><circle cx="12" cy="12" r="4.2" fill="#fffaf7"/><circle cx="12" cy="12" r="2.25" fill="#9be3d3"/><path fill="#ff6f96" d="M17.2 3.9c.55-.8 1.75-.44 1.75.48 0-.92 1.2-1.28 1.75-.48.42.62.1 1.35-.5 1.79l-1.25.92-1.25-.92c-.6-.44-.92-1.17-.5-1.79Z"/><path fill="#fff" d="m5.3 4.2.55 1.1 1.22.18-.88.86.2 1.2-1.09-.57-1.08.57.2-1.2-.88-.86 1.22-.18.54-1.1Z" opacity=".88"/></svg>`,
  };
  return icons[name] || "";
}

function loadingShell() {
  return `<main class="auth-shell"><section class="panel auth-card"><div class="status">${text.loading}</div></section></main>`;
}

function applyUiStyle() {
  document.documentElement.dataset.uiStyle = state.uiStyle;
  document.body?.classList.toggle("theme-style2", state.uiStyle === "style2");
  document.body?.classList.toggle("theme-style3", state.uiStyle === "style3");
}

