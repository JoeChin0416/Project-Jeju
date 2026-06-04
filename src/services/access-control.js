import { hasFirebaseConfig } from "./firebase.js";
import { readAccessSettings, writeAccessSettings } from "./db.js?v=20260604-qa-weather-ocr";

const LOCAL_ACCESS_KEY = "project-jeju.access-settings";

const DEFAULT_ACCESS_SETTINGS = {
  googleWhitelist: [],
};

export async function loadAccessSettings(user) {
  if (hasFirebaseConfig()) {
    const remoteSettings = await readAccessSettings();
    if (!remoteSettings && !canManageAccess(user)) return null;
    const settings = normalizeAccessSettings(remoteSettings);
    if (!remoteSettings) await writeAccessSettings(settings);
    return settings;
  }

  const saved = localStorage.getItem(LOCAL_ACCESS_KEY);
  return normalizeAccessSettings(saved ? JSON.parse(saved) : null);
}

export async function saveAccessSettings(settings) {
  const normalized = normalizeAccessSettings(settings);
  if (hasFirebaseConfig()) {
    await writeAccessSettings(normalized);
  } else {
    localStorage.setItem(LOCAL_ACCESS_KEY, JSON.stringify(normalized));
  }
  return normalized;
}

export function canManageAccess(user) {
  return user?.mode === "demo" || user?.authProvider === "password";
}

export function checkGoogleAccess(user, settings) {
  if (!user || user.mode !== "firebase" || user.authProvider !== "google.com") {
    return { allowed: true, reason: "" };
  }

  if (!settings) {
    return {
      allowed: false,
      reason: "Google 登入權限尚未初始化，請先使用 Email 登入建立白名單設定。",
    };
  }

  const whitelist = normalizeEmailList(settings?.googleWhitelist);
  if (whitelist.length === 0) {
    return {
      allowed: false,
      reason: "Google 登入白名單目前沒有任何帳號，請改用 Email 登入或請管理者加入白名單。",
    };
  }

  const email = normalizeEmail(user.email);
  if (whitelist.includes(email)) return { allowed: true, reason: "" };

  return {
    allowed: false,
    reason: "\u9019\u500b Google \u5e33\u865f\u5c1a\u672a\u958b\u653e\uff0c\u8acb\u6539\u7528 Email \u767b\u5165\u6216\u8acb\u7ba1\u7406\u8005\u52a0\u5165\u767d\u540d\u55ae\u3002",
  };
}

export function addGoogleWhitelistEmail(settings, email) {
  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmail(normalizedEmail)) {
    throw new Error("\u8acb\u8f38\u5165\u6b63\u78ba\u7684 email\u3002");
  }

  return normalizeAccessSettings({
    ...settings,
    googleWhitelist: [...(settings?.googleWhitelist ?? []), normalizedEmail],
  });
}

export function removeGoogleWhitelistEmail(settings, email) {
  const target = normalizeEmail(email);
  return normalizeAccessSettings({
    ...settings,
    googleWhitelist: normalizeEmailList(settings?.googleWhitelist).filter((entry) => entry !== target),
  });
}

export function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

function normalizeAccessSettings(settings) {
  return {
    ...DEFAULT_ACCESS_SETTINGS,
    ...(settings ?? {}),
    googleWhitelist: normalizeEmailList(settings?.googleWhitelist),
  };
}

function normalizeEmailList(emails) {
  return [...new Set((emails ?? []).map(normalizeEmail).filter(isValidEmail))].sort();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

