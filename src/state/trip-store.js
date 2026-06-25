import { getDefaultAvatarForIndex } from "../features/avatar-presets.js?v=20260623-split-ratio-clear";
import { normalizeTravelNotes } from "../features/journal.js?v=20260623-split-ratio-clear";
import { resolveAvatarUrl } from "../features/avatar-presets.js?v=20260623-split-ratio-clear";
import { PACKING_CATEGORIES, createDefaultPackingItems, createPersonalPackingItems } from "../features/packing.js?v=20260623-split-ratio-clear";
import { createRentalChecklist, normalizeRentalChecklist } from "../features/rental-checklist.js";
import { isDefaultPlaceholderMemberSet, removeRetiredMembersFromTrip } from "../features/members.js";
import {
  ensureUserProfile,
  readPersonalPacking,
  readSharedStore,
  subscribeSharedStore,
  writePersonalPacking,
  writeSharedStore,
} from "../services/db.js?v=20260623-split-ratio-clear";

const STORAGE_KEY = "project-jeju.demo-store";
const SHARED_SCHEMA_VERSION = "jeju-girls-2026-06-v2";
export const DEFAULT_EXCHANGE_RATE = 0.021;
let persistenceContext = { mode: "demo", uid: "" };
let storeSyncWarning = "";
let unsubscribeSharedStore = null;

export function loadStore() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const store = normalizeStore(JSON.parse(saved));
    saveStore(store);
    return store;
  }
  const store = createSeedStore();
  saveStore(store);
  return store;
}

export function saveStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  queueCloudSave(store);
}

export async function loadStoreForUser(user) {
  persistenceContext = { mode: user?.mode || "demo", uid: user?.uid || "" };
  storeSyncWarning = "";

  if (persistenceContext.mode === "firebase") {
    try {
      await ensureUserProfile(user);
      const sharedStore = await readSharedStore();
      const store = normalizeStore(sharedStore || createSeedStore());
      await applyPersonalPacking(store, persistenceContext.uid);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      const sharedPayload = toSharedStore(store);
      if (!sharedStore || JSON.stringify(sharedPayload) !== JSON.stringify(sharedStore)) {
        await writeSharedStore(sharedPayload);
      }
      return store;
    } catch (error) {
      storeSyncWarning = `Firestore \u540c\u6b65\u5931\u6557\uff0c\u5df2\u6539\u7528\u672c\u6a5f\u8cc7\u6599\uff1a${error.message}`;
      console.warn(storeSyncWarning);
    }
  }

  const store = loadStore();
  ensureLocalPersonalPacking(store, persistenceContext.uid || "demo-user");
  queueCloudSave(store);
  return store;
}

export function getStoreSyncWarning() {
  return storeSyncWarning;
}

export async function startSharedStoreSubscription(user, onStoreChange) {
  stopSharedStoreSubscription();
  if (user?.mode !== "firebase") return;
  unsubscribeSharedStore = await subscribeSharedStore(
    async (sharedStore) => {
      if (!sharedStore) return;
      const store = normalizeStore(sharedStore);
      await applyPersonalPacking(store, user.uid);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      onStoreChange(store);
    },
    (error) => {
      storeSyncWarning = `Firestore \u5373\u6642\u540c\u6b65\u5931\u6557\uff1a${error.message}`;
      console.warn(storeSyncWarning);
    },
  );
}

export function stopSharedStoreSubscription() {
  if (!unsubscribeSharedStore) return;
  unsubscribeSharedStore();
  unsubscribeSharedStore = null;
}

export function updateActiveTrip(store, updater) {
  const tripIndex = store.trips.findIndex((trip) => trip.id === store.lastTripId);
  if (tripIndex < 0) return store;
  const nextTrip = updater(structuredClone(store.trips[tripIndex]));
  store.trips[tripIndex] = { ...nextTrip, updatedAt: new Date().toISOString() };
  saveStore(store);
  return store;
}

export function createTrip(store, data) {
  const members = [];
  const trip = {
    id: crypto.randomUUID(),
    name: data.name || "\u65b0\u65c5\u884c",
    destination: data.destination || "",
    startDate: data.startDate || "",
    endDate: data.endDate || "",
    baseCurrency: data.baseCurrency || "TWD",
    tripCurrency: data.tripCurrency || "KRW",
    exchangeRate: normalizeExchangeRate(data.exchangeRate),
    members,
    itineraryDays: [],
    places: [],
    lodgings: [],
    transportItems: [],
    packingItems: createDefaultPackingItems(members),
    receiptBatches: [],
    expenseItems: [],
    travelNotes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.trips.push(trip);
  store.lastTripId = trip.id;
  saveStore(store);
  return store;
}

function normalizeStore(store) {
  if (!store || store.schemaVersion !== SHARED_SCHEMA_VERSION) return createSeedStore();

  store.trips = (store.trips ?? []).map((trip) => {
    const hasPlaceholderMembers = isDefaultPlaceholderMemberSet(trip.members ?? []);
    const members = hasPlaceholderMembers ? [] : (trip.members ?? []).map(normalizeMember).map(ensureMemberAvatar);
    const migratedTrip = {
      ...trip,
      exchangeRate: normalizeExchangeRate(trip.exchangeRate),
      members,
      expenseItems: hasPlaceholderMembers ? [] : normalizeExpenses(trip.expenseItems ?? [], trip),
      receiptBatches: trip.receiptBatches ?? [],
      lodgings: trip.lodgings ?? [],
      transportItems: normalizeTransportItems(trip.transportItems ?? []),
      places: trip.places ?? [],
      itineraryDays: trip.itineraryDays ?? [],
      travelNotes: normalizeTravelNotes(trip.travelNotes ?? [], trip),
    };
    const needsDefaultPacking =
      !Array.isArray(migratedTrip.packingItems) ||
      migratedTrip.packingItems.length < 10 ||
      !hasValidPackingItems(migratedTrip.packingItems);

    return removeRetiredMembersFromTrip({
      ...migratedTrip,
      packingItems: needsDefaultPacking ? createDefaultPackingItems(members) : migratedTrip.packingItems,
    });
  });
  return store;
}

function queueCloudSave(store) {
  if (persistenceContext.mode !== "firebase" || !persistenceContext.uid) return;
  const trip = store.trips.find((entry) => entry.id === store.lastTripId) ?? store.trips[0];
  Promise.all([
    writeSharedStore(toSharedStore(store)),
    writePersonalPacking(persistenceContext.uid, trip?.packingItems ?? []),
  ]).catch((error) => {
    storeSyncWarning = `Firestore \u5132\u5b58\u5931\u6557\uff1a${error.message}`;
    console.warn(storeSyncWarning);
  });
}

async function applyPersonalPacking(store, uid) {
  const trip = store.trips.find((entry) => entry.id === store.lastTripId) ?? store.trips[0];
  if (!trip || !uid) return store;
  const personalPacking = await readPersonalPacking(uid);
  const usePersonalPacking = Array.isArray(personalPacking) && personalPacking.length > 0 && hasValidPackingItems(personalPacking);
  trip.packingItems = usePersonalPacking ? personalPacking : createPersonalPackingItems(uid);
  if (!usePersonalPacking) await writePersonalPacking(uid, trip.packingItems);
  return store;
}

function ensureLocalPersonalPacking(store, uid) {
  const trip = store.trips.find((entry) => entry.id === store.lastTripId) ?? store.trips[0];
  if (!trip || !uid) return store;
  const currentItems = (trip.packingItems ?? []).filter((item) => item.ownerId === uid);
  trip.packingItems = currentItems.length > 0 && hasValidPackingItems(currentItems) ? currentItems : createPersonalPackingItems(uid);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  return store;
}

export function toSharedStore(store) {
  return {
    ...store,
    trips: store.trips.map((trip) => ({ ...trip, packingItems: [] })),
  };
}

function hasValidPackingItems(items) {
  return Array.isArray(items) &&
    items.length > 0 &&
    items.every((item) => item.ownerId && item.name && PACKING_CATEGORIES.includes(item.category));
}

function normalizeMember(member, index) {
  return ensureMemberAvatar({ active: true, ...member }, index);
}

function ensureMemberAvatar(member, index = 0) {
  const preset = getDefaultAvatarForIndex(index);
  const avatarPresetId = member.avatarPresetId || preset.id;
  return {
    ...member,
    avatarPresetId,
    avatarUrl: resolveAvatarUrl(avatarPresetId, member.avatarUrl),
  };
}

function normalizeExpenses(expenses, trip) {
  return expenses.map((expense) => ({
    ...expense,
    expenseDate: expense.expenseDate || findReceiptDate(trip, expense.receiptBatchId) || expense.createdAt?.slice(0, 10) || trip.startDate || "",
  }));
}

function normalizeTransportItems(items) {
  return items.map((item) => (
    item.type === "rental-car"
      ? { ...item, rentalChecklist: normalizeRentalChecklist(item.rentalChecklist) }
      : item
  ));
}

function normalizeExchangeRate(rate) {
  const numericRate = Number(rate);
  if (!Number.isFinite(numericRate) || numericRate <= 0) return DEFAULT_EXCHANGE_RATE;
  return numericRate === 0.024 ? DEFAULT_EXCHANGE_RATE : numericRate;
}

function findReceiptDate(trip, receiptBatchId) {
  if (!receiptBatchId) return "";
  return trip.receiptBatches?.find((receipt) => receipt.id === receiptBatchId)?.receiptDate || "";
}

function createSeedStore() {
  const tripId = "jeju-demo";
  const members = [];

  return {
    schemaVersion: SHARED_SCHEMA_VERSION,
    lastTripId: tripId,
    trips: [
      {
        id: tripId,
        name: "\u6fdf\u5dde\u958f\u871c\u4e94\u65e5\u904a",
        destination: "\u6fdf\u5dde\u5cf6",
        startDate: "2026-06-21",
        endDate: "2026-06-25",
        baseCurrency: "TWD",
        tripCurrency: "KRW",
        exchangeRate: DEFAULT_EXCHANGE_RATE,
        members,
        itineraryDays: [
          { id: "d1", date: "2026-06-21", title: "\u62b5\u9054\u8207\u5e02\u5340\u63a1\u8cb7", sortOrder: 1 },
          { id: "d2", date: "2026-06-22", title: "\u6d77\u908a\u8207\u6771\u7dda\u5c0f\u65c5\u884c", sortOrder: 2 },
          { id: "d3", date: "2026-06-23", title: "\u897f\u6b78\u6d66\u81ea\u7136\u666f\u9ede", sortOrder: 3 },
          { id: "d4", date: "2026-06-24", title: "\u897f\u7dda\u8336\u5712\u8207\u5496\u5561\u8857", sortOrder: 4 },
          { id: "d5", date: "2026-06-25", title: "\u514d\u7a05\u8cfc\u7269\u8207\u8fd4\u7a0b", sortOrder: 5 },
        ],
        places: [
          place("p1", "d1", "\u6fdf\u5dde\u570b\u969b\u6a5f\u5834", "Jeju International Airport", null, null, 1, "\u62b5\u9054\u5f8c\u53d6\u8eca\u3001\u78ba\u8a8d\u884c\u674e\u8207\u7db2\u8def\u3002"),
          place("p2", "d1", "Dodu-dong Rainbow Coastal Road", "Dodu-dong Rainbow Coastal Road", null, null, 2, "\u6d77\u908a\u5f69\u8679\u6b04\u6746\u62cd\u7167\u3002"),
          place("p3", "d1", "Olive Young Jeju Tapdong Branch", "Olive Young Jeju Tapdong Branch", null, null, 3, "\u5148\u8cb7\u9762\u819c\u3001\u9632\u66ec\u548c\u8b77\u5507\u818f\u3002"),
          place("p4", "d1", "\u6771\u9580\u50b3\u7d71\u5e02\u5834", "Dongmun Traditional Market", null, null, 4, "\u665a\u9910\u548c\u591c\u5e02\u5c0f\u5403\u3002"),
          place("p5", "d2", "\u54b8\u5fb7\u6d77\u6c34\u6d74\u5834", "Hamdeok Beach", null, null, 1, "\u6d77\u7058\u6563\u6b65\u548c\u5496\u5561\u3002"),
          place("p6", "d2", "Snoopy Garden", "Snoopy Garden, Jeju", null, null, 2, "\u53ef\u611b\u5834\u666f\u548c\u62cd\u7167\u9ede\u3002"),
          place("p7", "d2", "\u57ce\u5c71\u65e5\u51fa\u5cf0", "Seongsan Ilchulbong", null, null, 3, "\u6771\u7dda\u7d93\u5178\u666f\u9ede\u3002"),
          place("p8", "d3", "\u6b63\u623f\u7011\u5e03", "Jeongbang Waterfall", null, null, 1, "\u770b\u6d77\u908a\u7011\u5e03\u3002"),
          place("p9", "d3", "\u897f\u6b78\u6d66\u6bcf\u65e5\u5967\u4f86\u5e02\u5834", "Seogwipo Maeil Olle Market", null, null, 2, "\u5403\u5c0f\u5403\u3001\u8cb7\u4f34\u624b\u79ae\u3002"),
          place("p10", "d4", "Osulloc Tea Museum", "Osulloc Tea Museum, Jeju", null, null, 1, "\u7da0\u8336\u751c\u9ede\u548c\u8336\u5712\u62cd\u7167\u3002"),
          place("p11", "d4", "Innisfree Jeju House", "Innisfree Jeju House", null, null, 2, "\u6fdf\u5dde\u9650\u5b9a\u7f8e\u599d\u8207\u624b\u4f5c\u9ad4\u9a57\u3002"),
          place("p12", "d4", "\u6daf\u6708\u5496\u5561\u8857", "Aewol Cafe Street", null, null, 3, "\u6d77\u908a\u5496\u5561\u5ef3\u8207\u65e5\u843d\u3002"),
          place("p13", "d5", "Lotte Duty Free Jeju", "Lotte Duty Free Jeju", null, null, 1, "\u6700\u5f8c\u88dc\u8cb7\u7f8e\u599d\u8207\u4f34\u624b\u79ae\u3002"),
          place("p14", "d5", "\u6fdf\u5dde\u570b\u969b\u6a5f\u5834", "Jeju International Airport", null, null, 2, "\u9084\u8eca\u3001\u9818\u9000\u7a05\u3001\u8fd4\u7a0b\u3002"),
        ],
        lodgings: [
          {
            id: "l1",
            name: "\u6fdf\u5dde\u5e02\u4e2d\u5fc3\u98ef\u5e97",
            address: "Jeju-si",
            checkInAt: "2026-06-21 15:00",
            checkOutAt: "2026-06-25 11:00",
            confirmationCode: "",
            notes: "\u5efa\u8b70\u4f4f Tapdong \u6216 Nohyeong \u4e00\u5e36\uff0c\u9002\u5408\u901b\u8857\u8207\u958b\u8eca\u79fb\u52d5\u3002",
          },
        ],
        transportItems: [
          {
            id: "t1",
            type: "rental-car",
            provider: "\u79df\u8eca",
            code: "\u5f85\u78ba\u8a8d",
            departAt: "2026-06-21",
            arriveAt: "2026-06-25",
            origin: "\u6fdf\u5dde\u570b\u969b\u6a5f\u5834",
            destination: "\u6fdf\u5dde\u570b\u969b\u6a5f\u5834",
            parkingName: "\u6a5f\u5834\u79df\u8eca\u4e2d\u5fc3\u505c\u8eca\u5834",
            parkingLocation: "\u6fdf\u5dde\u570b\u969b\u6a5f\u5834",
            parkingLevel: "B1 / C\u5340",
            parkingPhotoUrl: "",
            parkingPhotoPath: "",
            parkingPhotoProvider: "",
            rentalChecklist: createRentalChecklist(),
            notes: "\u5efa\u8b70\u8a2d\u5b9a\u7b2c\u4e00\u4f4d\u99d5\u99db\u4eba\uff0c\u4e26\u8a18\u9304\u505c\u8eca\u4f4d\u7f6e\u3002",
          },
          {
            id: "t2",
            type: "flight",
            provider: "",
            airline: "",
            code: "",
            flightNo: "",
            origin: "TPE",
            destination: "CJU",
            originCity: "Taipei",
            destinationCity: "Jeju",
            departAt: "2026-06-21T10:00",
            arriveAt: "2026-06-21T13:00",
            terminalFrom: "",
            terminalTo: "",
            duration: "3h",
            baggage: "23kg * 2",
            aircraft: "",
            price: "",
            purchasedAt: "",
            bookingCode: "",
            notes: "\u53bb\u7a0b\u822a\u73ed\u5148\u653e\u6a21\u677f\uff0c\u78ba\u8a8d\u822a\u7a7a\u516c\u53f8\u8207\u822a\u73ed\u5f8c\u518d\u7de8\u8f2f\u3002",
          },
          {
            id: "t3",
            type: "flight",
            provider: "",
            airline: "",
            code: "",
            flightNo: "",
            origin: "CJU",
            destination: "TPE",
            originCity: "Jeju",
            destinationCity: "Taipei",
            departAt: "2026-06-25T15:00",
            arriveAt: "2026-06-25T17:30",
            terminalFrom: "",
            terminalTo: "",
            duration: "2h 30m",
            baggage: "23kg * 2",
            aircraft: "",
            price: "",
            purchasedAt: "",
            bookingCode: "",
            notes: "\u56de\u7a0b\u822a\u73ed\u5148\u653e\u6a21\u677f\uff0c\u78ba\u8a8d\u6642\u9593\u5f8c\u53ef\u76f4\u63a5\u4fee\u6539\u3002",
          },
        ],
        packingItems: createPersonalPackingItems("demo-user"),
        receiptBatches: [],
        expenseItems: [],
        travelNotes: [
          {
            id: "j1",
            type: "memo",
            title: "\u51fa\u767c\u524d\u63a1\u8cb7\u63d0\u9192",
            body: "\u5230 Olive Young \u53ef\u4ee5\u5148\u8cb7\u9762\u819c\u3001\u9632\u66ec\u3001\u8b77\u5507\u818f\uff0c\u518d\u7528\u8a18\u5e33\u6a21\u7d44\u5206\u5e33\u3002",
            photoUrl: "",
            photoPath: "",
            photoProvider: "",
            capturedAt: "2026-06-21T16:30:00.000Z",
            noteDate: "2026-06-21",
            tags: ["\u8cfc\u7269", "\u7f8e\u599d"],
            done: false,
            createdBy: "demo@example.com",
            updatedBy: "demo@example.com",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  };
}

function place(id, dayId, name, address, _lat, _lng, sortOrder, notes = "") {
  return { id, dayId, name, address, sortOrder, notes };
}

