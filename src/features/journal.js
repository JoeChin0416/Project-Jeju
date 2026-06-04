import { normalizeMoodId } from "./moods.js";

export const JOURNAL_TYPES = [
  { id: "photo", label: "\u7167\u7247" },
  { id: "memo", label: "\u5099\u5fd8" },
  { id: "todo", label: "\u4ee3\u8fa6" },
];

export function normalizeJournalType(type) {
  return JOURNAL_TYPES.some((entry) => entry.id === type) ? type : "memo";
}

export function getJournalDate(entry, trip) {
  return entry.noteDate || entry.capturedAt?.slice(0, 10) || entry.createdAt?.slice(0, 10) || trip?.startDate || "";
}

export function listJournalDates(trip) {
  const dates = new Set();
  (trip.itineraryDays || []).forEach((day) => {
    if (day.date) dates.add(day.date);
  });
  (trip.travelNotes || []).forEach((entry) => {
    const date = getJournalDate(entry, trip);
    if (date) dates.add(date);
  });
  return [...dates].sort();
}

export function createJournalEntry(data, user, now = new Date()) {
  const createdAt = now.toISOString();
  const type = normalizeJournalType(data.type);
  const capturedAt = data.capturedAt || createdAt;
  const noteDate = data.noteDate || capturedAt.slice(0, 10);

  return {
    id: data.id || crypto.randomUUID(),
    type,
    title: String(data.title || defaultTitle(type)),
    body: String(data.body || ""),
    photoUrl: data.photoUrl || "",
    photoPath: data.photoPath || "",
    photoProvider: data.photoProvider || "",
    moodId: normalizeMoodId(data.moodId),
    capturedAt,
    noteDate,
    tags: normalizeTags(data.tags),
    done: Boolean(data.done),
    createdBy: user?.email || user?.uid || "",
    updatedBy: user?.email || user?.uid || "",
    createdAt,
    updatedAt: createdAt,
  };
}

export function updateJournalEntry(entry, data, user, now = new Date()) {
  const type = normalizeJournalType(data.type || entry.type);
  const capturedAt = data.capturedAt || entry.capturedAt || now.toISOString();

  return {
    ...entry,
    type,
    title: String(data.title || defaultTitle(type)),
    body: String(data.body || ""),
    photoUrl: data.photoUrl ?? entry.photoUrl ?? "",
    photoPath: data.photoPath ?? entry.photoPath ?? "",
    photoProvider: data.photoProvider ?? entry.photoProvider ?? "",
    moodId: normalizeMoodId(data.moodId ?? entry.moodId),
    capturedAt,
    noteDate: data.noteDate || capturedAt.slice(0, 10),
    tags: normalizeTags(data.tags),
    done: Boolean(data.done),
    updatedBy: user?.email || user?.uid || entry.updatedBy || "",
    updatedAt: now.toISOString(),
  };
}

export function normalizeTravelNotes(notes, trip) {
  return (notes || []).map((entry) => ({
    type: "memo",
    title: "",
    body: "",
    photoUrl: "",
    photoPath: "",
    photoProvider: "",
    moodId: "",
    tags: [],
    done: false,
    createdBy: "",
    updatedBy: "",
    createdAt: entry.createdAt || new Date().toISOString(),
    updatedAt: entry.updatedAt || entry.createdAt || new Date().toISOString(),
    ...entry,
    type: normalizeJournalType(entry.type),
    moodId: normalizeMoodId(entry.moodId),
    noteDate: getJournalDate(entry, trip),
    tags: Array.isArray(entry.tags) ? entry.tags : normalizeTags(entry.tags),
  }));
}

function normalizeTags(value) {
  if (Array.isArray(value)) return value.map(String).map((tag) => tag.trim()).filter(Boolean);
  return String(value || "")
    .split(/[,\s，、]+/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function defaultTitle(type) {
  return {
    photo: "\u7167\u7247\u7d00\u9304",
    memo: "\u5099\u5fd8",
    todo: "\u4ee3\u8fa6\u4e8b\u9805",
  }[type] || "\u65c5\u8a18";
}
