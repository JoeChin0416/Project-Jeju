import test from "node:test";
import assert from "node:assert/strict";

import { accessSettingsPath, personalPackingPath, sharedStorePath } from "../src/services/db.js";
import { toSharedStore } from "../src/state/trip-store.js";

test("stores shared itinerary accounting and journal data without personal packing", () => {
  const shared = toSharedStore({
    schemaVersion: "test",
    lastTripId: "trip-1",
    trips: [{
      id: "trip-1",
      places: [{ id: "place-1" }],
      expenseItems: [{ id: "expense-1" }],
      travelNotes: [{ id: "journal-1" }],
      packingItems: [{ id: "private-item", ownerId: "user-a" }],
    }],
  });

  assert.deepEqual(shared.trips[0].places, [{ id: "place-1" }]);
  assert.deepEqual(shared.trips[0].expenseItems, [{ id: "expense-1" }]);
  assert.deepEqual(shared.trips[0].travelNotes, [{ id: "journal-1" }]);
  assert.deepEqual(shared.trips[0].packingItems, []);
});

test("uses one shared trip document and separate per-user packing documents", () => {
  assert.equal(sharedStorePath(), "sharedTrips/jeju-2026-girls/stores/default");
  assert.equal(accessSettingsPath(), "sharedTrips/jeju-2026-girls/access/default");
  assert.equal(personalPackingPath("user-a"), "users/user-a/personalPacking/jeju-2026-girls");
  assert.notEqual(personalPackingPath("user-a"), personalPackingPath("user-b"));
});
