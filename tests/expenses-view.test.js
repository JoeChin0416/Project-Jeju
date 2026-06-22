import test from "node:test";
import assert from "node:assert/strict";

test("expense sheet offers equal ratio and fixed amount split modes", async () => {
  globalThis.localStorage = globalThis.localStorage ?? {
    getItem: () => "",
    setItem: () => {},
    removeItem: () => {},
  };

  const [{ expensesView }, { state }] = await Promise.all([
    import("../src/views/expenses-view.js"),
    import("../src/state/app-state.js"),
  ]);

  state.modal = { type: "expense", mode: "edit", id: "expense-1", expenseDate: "2026-06-21" };
  const trip = {
    id: "trip",
    startDate: "2026-06-21",
    tripCurrency: "KRW",
    exchangeRate: 0.024,
    itineraryDays: [{ id: "day-1", date: "2026-06-21", title: "Day 1" }],
    receiptBatches: [],
    members: [
      { id: "a", name: "A", color: "#116b63" },
      { id: "b", name: "B", color: "#ee6b4d" },
    ],
    expenseItems: [
      {
        id: "expense-1",
        translatedName: "Snack",
        category: "Food",
        totalOriginal: 10000,
        totalBase: 240,
        currency: "KRW",
        exchangeRate: 0.024,
        payerId: "a",
        participantIds: ["a", "b"],
        splitMode: "fixed",
        splitValues: { a: 160, b: 80 },
        expenseDate: "2026-06-21",
      },
    ],
  };

  const view = expensesView(trip, () => {});

  assert.match(view.html, /name="splitMode" value="equal"/);
  assert.match(view.html, /name="splitMode" value="ratio"/);
  assert.match(view.html, /name="splitMode" value="fixed" checked/);
  assert.match(view.html, /data-split-fixed-value="a" value="160"/);
  assert.match(view.html, /data-split-fixed-value="b" value="80"/);

  state.modal = null;
});
