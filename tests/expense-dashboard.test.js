import test from "node:test";
import assert from "node:assert/strict";

import { buildCategoryPieGradient, summarizeDailySpending } from "../src/features/expense-dashboard.js";

const trip = {
  startDate: "2026-06-21",
  dailyBudgetBase: 1000,
  members: [{ id: "a" }, { id: "b" }],
  expenseItems: [
    { category: "\u9910\u98f2", totalBase: 300, expenseDate: "2026-06-21" },
    { category: "\u8cfc\u7269", totalBase: 900, expenseDate: "2026-06-21" },
    { category: "\u4ea4\u901a", totalBase: 200, expenseDate: "2026-06-22" },
  ],
};

test("summarizes daily spending dashboard values", () => {
  const summary = summarizeDailySpending(trip, "2026-06-21");

  assert.equal(summary.todayTotal, 1200);
  assert.equal(summary.tripTotal, 1400);
  assert.equal(summary.averagePerMember, 600);
  assert.equal(summary.topCategory.category, "\u8cfc\u7269");
  assert.equal(summary.isOverBudget, true);
  assert.equal(summary.budgetDelta, -200);
});

test("uses the trip daily budget instead of deriving an invisible default", () => {
  const summary = summarizeDailySpending(
    {
      ...trip,
      dailyBudgetBase: 1200,
      expenseItems: [{ totalBase: 900, expenseDate: "2026-06-21", category: "餐飲" }],
    },
    "2026-06-21",
  );

  assert.equal(summary.dailyBudgetBase, 1200);
  assert.equal(summary.budgetDelta, 300);
});

test("builds a conic gradient for non-empty category totals", () => {
  const summary = summarizeDailySpending(trip, "2026-06-21");
  const gradient = buildCategoryPieGradient(summary.categoryTotals);

  assert.match(gradient, /^conic-gradient\(/);
  assert.match(gradient, /deg/);
});
