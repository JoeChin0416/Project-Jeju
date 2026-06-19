import { after, before, beforeEach, test } from "node:test";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import {
  deleteObject,
  getBytes,
  ref,
  uploadBytes,
} from "firebase/storage";
import { readFile } from "node:fs/promises";

const projectId = "jeju-travel-f136b";
const ownerEmail = "dpluschin0416@gmail.com";
const sharedPath = "sharedTrips/jeju-2026-girls/stores/default";
const accessPath = "sharedTrips/jeju-2026-girls/access/default";
let testEnv;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: { rules: await readFile("firestore.rules", "utf8") },
    storage: { rules: await readFile("storage.rules", "utf8") },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), accessPath), {
      settings: {
        googleWhitelist: ["friend@gmail.com"],
        memberEmails: ["member@example.com"],
        adminEmails: [ownerEmail],
      },
    });
  });
});

after(async () => {
  await testEnv?.cleanup();
});

function passwordUser(uid = "admin") {
  return testEnv.authenticatedContext(uid, {
    email: `${uid}@example.com`,
    firebase: { sign_in_provider: "password" },
  });
}

function ownerUser() {
  return testEnv.authenticatedContext("owner", {
    email: ownerEmail,
    firebase: { sign_in_provider: "google.com" },
  });
}

function googleUser(uid, email) {
  return testEnv.authenticatedContext(uid, {
    email,
    firebase: { sign_in_provider: "google.com" },
  });
}

test("shared trip is denied to guests and unlisted users", async () => {
  await assertFails(getDoc(doc(testEnv.unauthenticatedContext().firestore(), sharedPath)));
  await assertFails(getDoc(doc(googleUser("stranger", "stranger@gmail.com").firestore(), sharedPath)));
  await assertFails(getDoc(doc(passwordUser("stranger").firestore(), sharedPath)));
});

test("Google access fails closed until settings exist and while whitelist is empty", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await deleteDoc(doc(context.firestore(), accessPath));
  });
  await assertFails(getDoc(doc(googleUser("friend", "friend@gmail.com").firestore(), sharedPath)));

  await assertSucceeds(setDoc(doc(ownerUser().firestore(), accessPath), {
    settings: { googleWhitelist: [], memberEmails: [], adminEmails: [ownerEmail] },
  }));
  await assertFails(getDoc(doc(googleUser("friend", "friend@gmail.com").firestore(), sharedPath)));
});

test("legacy access settings that only contain Google whitelist remain readable by whitelisted Google users", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), accessPath), {
      settings: { googleWhitelist: ["friend@gmail.com"] },
    });
  });

  await assertSucceeds(getDoc(doc(googleUser("friend", "friend@gmail.com").firestore(), sharedPath)));
  await assertFails(getDoc(doc(passwordUser("member").firestore(), sharedPath)));
});

test("password members and whitelisted Google users share itinerary accounting and journal updates in real time", async () => {
  const writer = passwordUser("member").firestore();
  const reader = googleUser("friend", "friend@gmail.com").firestore();
  const sharedRef = doc(writer, sharedPath);
  await assertSucceeds(setDoc(sharedRef, { store: { revision: 1, trips: [] } }));

  let markReady;
  const ready = new Promise((resolve) => {
    markReady = resolve;
  });
  const observed = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("shared snapshot timed out")), 5000);
    const unsubscribe = onSnapshot(doc(reader, sharedPath), (snapshot) => {
      if (snapshot.data()?.store?.revision === 1) markReady();
      if (snapshot.data()?.store?.revision === 2) {
        clearTimeout(timeout);
        unsubscribe();
        resolve(snapshot.data());
      }
    }, reject);
  });

  await ready;
  await assertSucceeds(setDoc(sharedRef, {
    store: {
      revision: 2,
      trips: [{
        places: [{ id: "place-1" }],
        expenseItems: [{ id: "expense-1" }],
        travelNotes: [{ id: "journal-1" }],
        packingItems: [],
      }],
    },
  }));
  await observed;
});

test("personal packing can only be read and written by its owner", async () => {
  const ownerPath = "users/user-a/personalPacking/jeju-2026-girls";
  await assertSucceeds(setDoc(doc(passwordUser("user-a").firestore(), ownerPath), { items: [{ name: "護照" }] }));
  await assertSucceeds(getDoc(doc(passwordUser("user-a").firestore(), ownerPath)));
  await assertFails(getDoc(doc(passwordUser("user-b").firestore(), ownerPath)));
});

test("only owners and admins can manage access settings", async () => {
  await assertSucceeds(getDoc(doc(googleUser("friend", "friend@gmail.com").firestore(), accessPath)));
  await assertFails(getDoc(doc(googleUser("stranger", "stranger@gmail.com").firestore(), accessPath)));

  await assertSucceeds(setDoc(doc(ownerUser().firestore(), accessPath), {
    settings: {
      googleWhitelist: ["friend@gmail.com"],
      memberEmails: ["member@example.com"],
      adminEmails: [ownerEmail, "admin@example.com"],
    },
  }));

  await assertSucceeds(setDoc(doc(passwordUser("admin").firestore(), accessPath), {
    settings: {
      googleWhitelist: ["friend@gmail.com"],
      memberEmails: ["member@example.com"],
      adminEmails: [ownerEmail, "admin@example.com"],
    },
  }));
  await assertFails(setDoc(doc(googleUser("friend", "friend@gmail.com").firestore(), accessPath), {
    settings: { googleWhitelist: ["friend@gmail.com"], memberEmails: ["friend@gmail.com"], adminEmails: [ownerEmail] },
  }));
  await assertFails(setDoc(doc(passwordUser("member").firestore(), accessPath), {
    settings: { googleWhitelist: ["member@example.com"], memberEmails: ["member@example.com"], adminEmails: [ownerEmail] },
  }));
  await assertFails(setDoc(doc(googleUser("stranger", "stranger@gmail.com").firestore(), accessPath), {
    settings: { googleWhitelist: ["stranger@gmail.com"], memberEmails: ["stranger@gmail.com"], adminEmails: [ownerEmail] },
  }));
  await assertFails(deleteDoc(doc(ownerUser().firestore(), accessPath)));
});

test("storage accepts shared trip images from allowed users only", async () => {
  const image = new Uint8Array([255, 216, 255, 217]);
  const allowedRef = ref(passwordUser("member").storage(), "trips/jeju/parking/car-1/photo.jpg");
  const allowedGoogleRef = ref(googleUser("friend", "friend@gmail.com").storage(), "trips/jeju/parking/car-1/friend.jpg");
  const blockedRef = ref(googleUser("stranger", "stranger@gmail.com").storage(), "trips/jeju/parking/car-1/blocked.jpg");
  const invalidRef = ref(passwordUser("writer").storage(), "trips/jeju/parking/car-1/file.txt");

  await assertSucceeds(uploadBytes(allowedRef, image, { contentType: "image/jpeg" }));
  await assertSucceeds(getBytes(allowedRef));
  await assertSucceeds(uploadBytes(allowedGoogleRef, image, { contentType: "image/jpeg" }));
  await assertFails(uploadBytes(blockedRef, image, { contentType: "image/jpeg" }));
  await assertFails(uploadBytes(invalidRef, image, { contentType: "text/plain" }));
});

test("only owners and admins can delete shared trip images", async () => {
  const image = new Uint8Array([255, 216, 255, 217]);
  const photoPath = "trips/jeju/parking/car-1/member-photo.jpg";
  const memberRef = ref(passwordUser("member").storage(), photoPath);
  const friendRef = ref(googleUser("friend", "friend@gmail.com").storage(), photoPath);
  const ownerRef = ref(ownerUser().storage(), photoPath);

  await assertSucceeds(uploadBytes(memberRef, image, { contentType: "image/jpeg" }));
  await assertFails(deleteObject(friendRef));
  await assertSucceeds(deleteObject(ownerRef));
});
