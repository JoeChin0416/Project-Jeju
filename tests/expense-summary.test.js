import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateMemberExpenseSummary,
  getExpenseDate,
  listExpenseDates,
} from "../src/features/expense-summary.js";

const trip = {
  startDate: "2026-06-21",
  endDate: "2026-06-23",
  itineraryDays: [
    { date: "2026-06-21", title: "Day 1" },
    { date: "2026-06-22", title: "Day 2" },
  ],
  members: [
    { id: "a", name: "A" },
    { id: "b", name: "B" },
  ],
  expenseItems: [
    {
      id: "e1",
      expenseDate: "2026-06-22",
      payerId: "a",
      totalBase: 200,
      participantIds: ["a", "b"],
      splitMode: "equal",
      splitValues: {},
    },
    {
      id: "e2",
      createdAt: "2026-06-23T09:00:00.000Z",
      payerId: "b",
      totalBase: 90,
      participantIds: ["b"],
      splitMode: "fixed",
      splitValues: { b: 90 },
    },
  ],
};

test("gets expense dates from explicit date then createdAt then trip start date", () => {
  assert.equal(getExpenseDate({ expenseDate: "2026-06-22" }, trip), "2026-06-22");
  assert.equal(getExpenseDate({ createdAt: "2026-06-23T09:00:00.000Z" }, trip), "2026-06-23");
  assert.equal(getExpenseDate({}, trip), "2026-06-21");
});

test("lists itinerary and expense dates for daily accounting tabs", () => {
  assert.deepEqual(listExpenseDates(trip), ["2026-06-21", "2026-06-22", "2026-06-23"]);
});

test("calculates member paid, spent, and net summary", () => {
  const summary = calculateMemberExpenseSummary(trip.members, trip.expenseItems);

  assert.deepEqual(summary.a, { paid: 200, spent: 100, net: 100 });
  assert.deepEqual(summary.b, { paid: 90, spent: 190, net: -100 });
});
