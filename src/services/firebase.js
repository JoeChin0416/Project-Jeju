import { firebaseConfig, hasFirebaseConfig } from "../config/firebase-config.js?v=20260623-split-ratio-clear";

let firebaseRuntime = null;

export async function initializeFirebaseRuntime() {
  if (!hasFirebaseConfig()) {
    return { mode: "demo", app: null, auth: null, db: null };
  }

  if (firebaseRuntime) return firebaseRuntime;

  const [{ initializeApp }, { getAuth }, { getFirestore }, { getStorage }] = await Promise.all([
    import("firebase/app"),
    import("firebase/auth"),
    import("firebase/firestore"),
    import("firebase/storage"),
  ]);

  const app = initializeApp(firebaseConfig);
  firebaseRuntime = {
    mode: "firebase",
    app,
    auth: getAuth(app),
    db: getFirestore(app),
    storage: getStorage(app),
  };
  return firebaseRuntime;
}

export { hasFirebaseConfig };


