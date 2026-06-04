export const firebaseConfig = {
  apiKey: "AIzaSyCpVNMSvBc4Zhq4oh8tp4JYE7PvwA9yi4w",
  authDomain: "jeju-travel-f136b.firebaseapp.com",
  projectId: "jeju-travel-f136b",
  storageBucket: "jeju-travel-f136b.firebasestorage.app",
  messagingSenderId: "127624194834",
  appId: "1:127624194834:web:5bd320e78c928abb1021cb",
};

export function hasFirebaseConfig() {
  return !Object.values(firebaseConfig).some((value) => String(value).startsWith("PASTE_"));
}

