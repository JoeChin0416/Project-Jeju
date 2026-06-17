const UI_STYLE_KEY = "project-jeju.ui-style";
const UI_STYLES = new Set(["style1", "style2", "style3"]);

function readUiStyle() {
  try {
    const savedStyle = localStorage.getItem(UI_STYLE_KEY);
    return UI_STYLES.has(savedStyle) ? savedStyle : "style1";
  } catch {
    return "style1";
  }
}

export const state = {
  user: null,
  store: null,
  accessSettings: null,
  uiStyle: readUiStyle(),
  activeTab: "itinerary",
  itinerarySection: "days",
  itineraryDayId: "",
  packingOwnerId: "",
  cameraMode: "receipt",
  expenseDateFilter: "",
  journalDateFilter: "",
  journalPhotoDraftUrl: "",
  journalPhotoPreviewUrl: "",
  journalPhotoDraftPath: "",
  journalPhotoDraftProvider: "",
  journalPhotoDraftId: "",
  journalPhotoUploading: false,
  journalPhotoError: "",
  weatherByDate: {},
  weatherTripKey: "",
  weatherLocation: "",
  weatherFetchedAt: "",
  weatherStatus: "idle",
  weatherError: "",
  modal: null,
  memberAvatarDraftUrl: "",
  memberAvatarPresetId: "",
  loading: false,
  error: "",
  notice: "",
  ocrDraft: null,
  ocrPayerId: "",
  ocrParticipantIds: [],
  imagePreviewUrl: "",
  receiptPhotoDraftUrl: "",
  receiptPhotoDraftPath: "",
  receiptPhotoDraftProvider: "",
  translationResult: "",
  translationLayout: null,
};

export function setState(patch) {
  Object.assign(state, patch);
}

export function setUiStyle(style) {
  state.uiStyle = UI_STYLES.has(style) ? style : "style1";
  try {
    localStorage.setItem(UI_STYLE_KEY, state.uiStyle);
  } catch {
    // Keep the chosen style for this session when localStorage is unavailable.
  }
}

export function getActiveTrip() {
  return state.store?.trips.find((trip) => trip.id === state.store.lastTripId) ?? state.store?.trips[0] ?? null;
}

export function getTripCollection(name) {
  const trip = getActiveTrip();
  return trip?.[name] ?? [];
}

export function setActiveTab(tab) {
  state.activeTab = tab;
  location.hash = `#/${tab}`;
}

export function readTabFromHash() {
  const value = location.hash.replace("#/", "");
  return ["itinerary", "packing", "camera", "expenses", "journal", "settings"].includes(value)
    ? value
    : "itinerary";
}

