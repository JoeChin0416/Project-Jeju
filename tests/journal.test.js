import test from "node:test";
import assert from "node:assert/strict";

import {
  createJournalEntry,
  getJournalDate,
  listJournalDates,
  normalizeTravelNotes,
  updateJournalEntry,
} from "../src/features/journal.js";

const user = { email: "demo@example.com" };
const now = new Date("2026-06-21T09:30:00.000Z");

test("creates shared journal entries with captured time, tags, mood, and storage metadata", () => {
  const entry = createJournalEntry(
    {
      id: "photo-draft-1",
      type: "photo",
      title: "Cafe photo",
      body: "Window seat",
      photoUrl: "https://storage.example/photo.jpg",
      photoPath: "trips/jeju/journal/photo-draft-1/photo.jpg",
      photoProvider: "firebase-storage",
      moodId: "pretty",
      capturedAt: "2026-06-21T18:20",
      tags: "cafe shopping",
    },
    user,
    now,
  );

  assert.equal(entry.id, "photo-draft-1");
  assert.equal(entry.type, "photo");
  assert.equal(entry.noteDate, "2026-06-21");
  assert.deepEqual(entry.tags, ["cafe", "shopping"]);
  assert.equal(entry.photoPath, "trips/jeju/journal/photo-draft-1/photo.jpg");
  assert.equal(entry.photoProvider, "firebase-storage");
  assert.equal(entry.moodId, "pretty");
  assert.equal(entry.createdBy, "demo@example.com");
});

test("updates journal entries without losing existing photo metadata", () => {
  const entry = createJournalEntry(
    {
      type: "todo",
      title: "Tax refund",
      moodId: "excited",
      photoUrl: "https://storage.example/photo.jpg",
      photoPath: "trips/jeju/journal/tax/photo.jpg",
      photoProvider: "firebase-storage",
    },
    user,
    now,
  );
  const updated = updateJournalEntry(entry, { type: "todo", title: "Tax refund done", done: true }, user, now);

  assert.equal(updated.title, "Tax refund done");
  assert.equal(updated.done, true);
  assert.equal(updated.moodId, "excited");
  assert.equal(updated.photoUrl, "https://storage.example/photo.jpg");
  assert.equal(updated.photoPath, "trips/jeju/journal/tax/photo.jpg");
});

test("lists journal dates from itinerary and entries", () => {
  const trip = {
    startDate: "2026-06-21",
    itineraryDays: [{ date: "2026-06-21" }],
    travelNotes: [
      { type: "memo", createdAt: "2026-06-22T10:00:00.000Z" },
      { type: "todo", noteDate: "2026-06-23" },
    ],
  };

  assert.equal(getJournalDate(trip.travelNotes[0], trip), "2026-06-22");
  assert.deepEqual(listJournalDates(trip), ["2026-06-21", "2026-06-22", "2026-06-23"]);
  assert.equal(normalizeTravelNotes([{ type: "bad", tags: "a,b", moodId: "missing" }], trip)[0].type, "memo");
  assert.equal(normalizeTravelNotes([{ type: "bad", tags: "a,b", moodId: "missing" }], trip)[0].moodId, "");
});
