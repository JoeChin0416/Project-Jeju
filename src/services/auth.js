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
  const { getRedirectResult, onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js");

  const redirectResult = await withTimeout(getRedirectResult(runtime.auth), 2500, null);
  if (redirectResult?.user) return normalizeFirebaseUser(redirectResult.user);
  return waitForAuthUser(runtime.auth, onAuthStateChanged, 2500);
}

export async function signInWithEmail(email, password) {
  if (!hasFirebaseConfig()) return { ...DEMO_USER, email: email || DEMO_USER.email };
  const runtime = await initializeFirebaseRuntime();
  const { signInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js");
  const result = await signInWithEmailAndPassword(runtime.auth, email, password);
  return normalizeFirebaseUser(result.user, "password");
}

export async function signInWithGoogle() {
  if (!hasFirebaseConfig()) return DEMO_USER;
  const runtime = await initializeFirebaseRuntime();
  const { GoogleAuthProvider, signInWithPopup } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js");
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(runtime.auth, provider);
  return normalizeFirebaseUser(result.user, "google.com");
}

export async function signOutUser() {
  if (!hasFirebaseConfig()) return;
  const runtime = await initializeFirebaseRuntime();
  const { signOut } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js");
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
