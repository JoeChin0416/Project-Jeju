import { OWNER_EMAILS, isOwnerEmail, isValidEmail, normalizeEmail } from "../features/members.js";
import { readAccessSettings, writeAccessSettings } from "./db.js?v=20260604-qa-weather-ocr";
import { hasFirebaseConfig } from "./firebase.js";

const LOCAL_ACCESS_KEY = "project-jeju.access-settings";

const DEFAULT_ACCESS_SETTINGS = {
  googleWhitelist: [],
  memberEmails: [],
  adminEmails: OWNER_EMAILS,
};

export async function loadAccessSettings(user) {
  if (hasFirebaseConfig()) {
    const remoteSettings = await readAccessSettings();
    if (!remoteSettings && !canManageAccess(user, null)) return null;
    const settings = normalizeAccessSettings(remoteSettings);
    if (!remoteSettings || hasAccessSettingsChanged(remoteSettings, settings)) await writeAccessSettings(settings);
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

export function canManageAccess(user, settings) {
  return user?.mode === "demo" ||
    isOwnerEmail(user?.email) ||
    normalizeEmailList(settings?.adminEmails).includes(normalizeEmail(user?.email));
}

export function checkGoogleAccess(user, settings) {
  return checkUserAccess(user, settings);
}

export function checkUserAccess(user, settings) {
  if (!user || user.mode !== "firebase") {
    return { allowed: true, reason: "" };
  }

  if (isOwnerEmail(user.email)) return { allowed: true, reason: "" };

  if (!settings) {
    return {
      allowed: false,
      reason: "登入權限尚未初始化，請先由主要管理者登入並建立設定。",
    };
  }

  const email = normalizeEmail(user.email);
  const adminEmails = normalizeEmailList(settings.adminEmails);
  const memberEmails = normalizeEmailList(settings.memberEmails);
  const googleWhitelist = normalizeEmailList(settings.googleWhitelist);

  if (adminEmails.includes(email) || memberEmails.includes(email)) return { allowed: true, reason: "" };
  if (user.authProvider === "google.com" && googleWhitelist.includes(email)) return { allowed: true, reason: "" };

  if (user.authProvider === "google.com" && googleWhitelist.length === 0) {
    return {
      allowed: false,
      reason: "Google 登入白名單尚未開放，請先請主要管理者在設定中加入你的 Email。",
    };
  }

  return {
    allowed: false,
    reason: "這個帳號尚未被加入旅伴角色或 Google 白名單，請先請主要管理者開放權限。",
  };
}

export function addGoogleWhitelistEmail(settings, email) {
  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmail(normalizedEmail)) {
    throw new Error("請輸入有效的 Email。");
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

export function syncMemberEmails(settings, members) {
  return normalizeAccessSettings({
    ...settings,
    memberEmails: members.map((member) => member.email),
  });
}

export function removeAccessEmail(settings, email) {
  const target = normalizeEmail(email);
  return normalizeAccessSettings({
    ...settings,
    googleWhitelist: normalizeEmailList(settings?.googleWhitelist).filter((entry) => entry !== target),
    memberEmails: normalizeEmailList(settings?.memberEmails).filter((entry) => entry !== target),
  });
}

function normalizeAccessSettings(settings) {
  return {
    ...DEFAULT_ACCESS_SETTINGS,
    ...(settings ?? {}),
    googleWhitelist: normalizeEmailList(settings?.googleWhitelist),
    memberEmails: normalizeEmailList(settings?.memberEmails),
    adminEmails: normalizeEmailList([...(settings?.adminEmails ?? []), ...OWNER_EMAILS]),
  };
}

function normalizeEmailList(emails) {
  return [...new Set((emails ?? []).map(normalizeEmail).filter(isValidEmail))].sort();
}

function hasAccessSettingsChanged(rawSettings, normalizedSettings) {
  return ["googleWhitelist", "memberEmails", "adminEmails"].some((key) =>
    JSON.stringify(normalizeEmailList(rawSettings?.[key])) !== JSON.stringify(normalizedSettings[key] ?? []),
  );
}
