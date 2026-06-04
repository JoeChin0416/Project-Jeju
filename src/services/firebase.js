import { firebaseConfig, hasFirebaseConfig } from "../config/firebase-config.js?v=20260604-qa-weather-ocr";

let firebaseRuntime = null;

export async function initializeFirebaseRuntime() {
  if (!hasFirebaseConfig()) {
    return { mode: "demo", app: null, auth: null, db: null };
  }

  if (firebaseRuntime) return firebaseRuntime;

  const [{ initializeApp }, { getAuth }, { getFirestore }, { getStorage }] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js"),
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js"),
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


