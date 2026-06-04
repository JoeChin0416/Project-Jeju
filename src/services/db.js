import { hasFirebaseConfig, initializeFirebaseRuntime } from "./firebase.js";

const SHARED_TRIP_ID = "jeju-2026-girls";

export async function readDemoStore() {
  return null;
}

export async function writeDemoStore(store) {
  return store;
}

export function userPath(uid) {
  return `users/${uid}`;
}

export function tripPath(uid, tripId) {
  return `${userPath(uid)}/trips/${tripId}`;
}

export function sharedStorePath() {
  return `sharedTrips/${SHARED_TRIP_ID}/stores/default`;
}

export function accessSettingsPath() {
  return `sharedTrips/${SHARED_TRIP_ID}/access/default`;
}

export function personalPackingPath(uid) {
  return `${userPath(uid)}/personalPacking/${SHARED_TRIP_ID}`;
}

export async function readSharedStore() {
  if (!hasFirebaseConfig()) return null;
  const runtime = await initializeFirebaseRuntime();
  const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");
  const snapshot = await getDoc(doc(runtime.db, sharedStorePath()));
  return snapshot.exists() ? snapshot.data().store ?? null : null;
}

export async function writeSharedStore(store) {
  if (!hasFirebaseConfig()) return store;
  const runtime = await initializeFirebaseRuntime();
  const { doc, serverTimestamp, setDoc } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");
  await setDoc(
    doc(runtime.db, sharedStorePath()),
    {
      store: JSON.parse(JSON.stringify(store)),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  return store;
}

export async function readAccessSettings() {
  if (!hasFirebaseConfig()) return null;
  const runtime = await initializeFirebaseRuntime();
  const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");
  const snapshot = await getDoc(doc(runtime.db, accessSettingsPath()));
  return snapshot.exists() ? snapshot.data().settings ?? null : null;
}

export async function writeAccessSettings(settings) {
  if (!hasFirebaseConfig()) return settings;
  const runtime = await initializeFirebaseRuntime();
  const { doc, serverTimestamp, setDoc } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");
  await setDoc(
    doc(runtime.db, accessSettingsPath()),
    {
      settings: JSON.parse(JSON.stringify(settings)),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  return settings;
}

export async function readPersonalPacking(uid) {
  if (!hasFirebaseConfig() || !uid) return null;
  const runtime = await initializeFirebaseRuntime();
  const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");
  const snapshot = await getDoc(doc(runtime.db, personalPackingPath(uid)));
  return snapshot.exists() ? snapshot.data().items ?? null : null;
}

export async function writePersonalPacking(uid, items) {
  if (!hasFirebaseConfig() || !uid) return items;
  const runtime = await initializeFirebaseRuntime();
  const { doc, serverTimestamp, setDoc } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");
  await setDoc(
    doc(runtime.db, personalPackingPath(uid)),
    {
      items: JSON.parse(JSON.stringify(items)),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  return items;
}

export async function subscribeSharedStore(onStore, onError) {
  if (!hasFirebaseConfig()) return () => {};
  const runtime = await initializeFirebaseRuntime();
  const { doc, onSnapshot } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");
  return onSnapshot(
    doc(runtime.db, sharedStorePath()),
    (snapshot) => onStore(snapshot.exists() ? snapshot.data().store ?? null : null),
    onError,
  );
}

export async function ensureUserProfile(user) {
  if (!hasFirebaseConfig() || !user?.uid) return;
  const runtime = await initializeFirebaseRuntime();
  const { doc, serverTimestamp, setDoc } = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");
  await setDoc(
    doc(runtime.db, userPath(user.uid)),
    {
      displayName: user.displayName || "",
      email: user.email || "",
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

