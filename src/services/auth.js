import { hasFirebaseConfig, initializeFirebaseRuntime } from "./firebase.js";

const DEMO_USER = {
  uid: "demo-user",
  displayName: "Demo Traveler",
  email: "demo@example.com",
  authProvider: "demo",
  mode: "demo",
};

export async function getInitialUser() {
  if (!hasFirebaseConfig()) return DEMO_USER;
  const runtime = await initializeFirebaseRuntime();
  const { getRedirectResult, onAuthStateChanged } = await import("firebase/auth");

  const redirectResult = await withTimeout(getRedirectResult(runtime.auth), 2500, null);
  if (redirectResult?.user) return normalizeFirebaseUser(redirectResult.user);
  return waitForAuthUser(runtime.auth, onAuthStateChanged, 2500);
}

export async function signInWithEmail(email, password) {
  if (!hasFirebaseConfig()) return { ...DEMO_USER, email: email || DEMO_USER.email };
  const runtime = await initializeFirebaseRuntime();
  const { signInWithEmailAndPassword } = await import("firebase/auth");
  try {
    const result = await signInWithEmailAndPassword(runtime.auth, email, password);
    return normalizeFirebaseUser(result.user, "password");
  } catch (error) {
    throw normalizeAuthError(error);
  }
}

export async function signInWithGoogle() {
  if (!hasFirebaseConfig()) return DEMO_USER;
  const runtime = await initializeFirebaseRuntime();
  const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  try {
    const result = await signInWithPopup(runtime.auth, provider);
    return normalizeFirebaseUser(result.user, "google.com");
  } catch (error) {
    throw normalizeAuthError(error);
  }
}

export async function signOutUser() {
  if (!hasFirebaseConfig()) return;
  const runtime = await initializeFirebaseRuntime();
  const { signOut } = await import("firebase/auth");
  await signOut(runtime.auth);
}

function normalizeFirebaseUser(user, authProvider = "") {
  return {
    uid: user.uid,
    displayName: user.displayName || user.email || "Traveler",
    email: user.email || "",
    authProvider: authProvider || inferAuthProvider(user),
    mode: "firebase",
  };
}

function inferAuthProvider(user) {
  const providerIds = (user.providerData ?? []).map((provider) => provider.providerId);
  if (providerIds.includes("password")) return "password";
  if (providerIds.includes("google.com")) return "google.com";
  return providerIds[0] || "";
}

export function normalizeAuthError(error) {
  if (error?.code === "auth/admin-restricted-operation") {
    return new Error(
      "Firebase Auth 目前禁止終端使用者建立帳號。白名單只控制 App 資料權限，不能自動建立 Firebase Auth 使用者。請先暫時開啟 Firebase Auth 的建立帳號功能，讓這個 Google 帳號成功登入一次，或由管理者用後端/Admin SDK 建立可登入的 Auth 使用者。",
    );
  }
  return error;
}

function waitForAuthUser(auth, onAuthStateChanged, timeoutMs) {
  return new Promise((resolve, reject) => {
    let unsubscribe = null;
    const timer = setTimeout(() => {
      unsubscribe?.();
      resolve(null);
    }, timeoutMs);

    unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        clearTimeout(timer);
        unsubscribe?.();
        resolve(user ? normalizeFirebaseUser(user) : null);
      },
      (error) => {
        clearTimeout(timer);
        unsubscribe?.();
        reject(error);
      },
    );
  });
}

function withTimeout(promise, timeoutMs, fallbackValue) {
  let timer = null;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve(fallbackValue), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
