import { hasFirebaseConfig, initializeFirebaseRuntime } from "./firebase.js";

export async function uploadJournalPhoto(blob, options = {}) {
  const runtime = await initializeFirebaseRuntime();
  const draftId = options.draftId || crypto.randomUUID();
  const fileName = safeFileName(options.fileName || "journal-photo.jpg");

  if (!hasFirebaseConfig() || runtime.mode !== "firebase" || !runtime.storage) {
    return {
      photoUrl: await blobToDataUrl(blob),
      photoPath: "",
      photoProvider: "demo",
    };
  }

  const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
  const path = [
    "trips",
    safePathSegment(options.tripId || "default-trip"),
    "journal",
    safePathSegment(draftId),
    `${Date.now()}-${fileName}`,
  ].join("/");
  const storageRef = ref(runtime.storage, path);

  await uploadBytes(storageRef, blob, {
    contentType: blob.type || "image/jpeg",
    customMetadata: {
      tripId: String(options.tripId || ""),
      uploadedBy: String(options.user?.email || options.user?.uid || ""),
    },
  });

  return {
    photoUrl: await getDownloadURL(storageRef),
    photoPath: path,
    photoProvider: "firebase-storage",
  };
}

export async function uploadReceiptPhoto(blob, options = {}) {
  return uploadTripPhoto(blob, {
    ...options,
    folder: "receipts",
    defaultName: "receipt-photo.jpg",
  });
}

export async function uploadParkingPhoto(blob, options = {}) {
  return uploadTripPhoto(blob, {
    ...options,
    folder: "parking",
    defaultName: "parking-photo.jpg",
  });
}

export async function deleteJournalPhoto(photoPath) {
  if (!photoPath || !hasFirebaseConfig()) return;
  const runtime = await initializeFirebaseRuntime();
  if (runtime.mode !== "firebase" || !runtime.storage) return;

  const { ref, deleteObject } = await import("firebase/storage");
  await deleteObject(ref(runtime.storage, photoPath));
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function uploadTripPhoto(blob, options = {}) {
  const runtime = await initializeFirebaseRuntime();
  const draftId = options.draftId || crypto.randomUUID();
  const fileName = safeFileName(options.fileName || options.defaultName || "photo.jpg");

  if (!hasFirebaseConfig() || runtime.mode !== "firebase" || !runtime.storage) {
    return {
      photoUrl: await blobToDataUrl(blob),
      photoPath: "",
      photoProvider: "demo",
    };
  }

  const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
  const path = [
    "trips",
    safePathSegment(options.tripId || "default-trip"),
    safePathSegment(options.folder || "photos"),
    safePathSegment(draftId),
    `${Date.now()}-${fileName}`,
  ].join("/");
  const storageRef = ref(runtime.storage, path);

  await uploadBytes(storageRef, blob, {
    contentType: blob.type || "image/jpeg",
    customMetadata: {
      tripId: String(options.tripId || ""),
      uploadedBy: String(options.user?.email || options.user?.uid || ""),
    },
  });

  return {
    photoUrl: await getDownloadURL(storageRef),
    photoPath: path,
    photoProvider: "firebase-storage",
  };
}

function safeFileName(value) {
  const normalized = String(value || "journal-photo.jpg")
    .replace(/[\\/:*?"<>|#%{}^~[\]`]+/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 80);
  return normalized || "journal-photo.jpg";
}

function safePathSegment(value) {
  return String(value || "item")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "item";
}

