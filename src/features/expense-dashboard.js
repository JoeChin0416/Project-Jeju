import { EXPENSE_CATEGORIES, normalizeExpenseCategory } from "./expense-categories.js";
import { getExpenseDate } from "./expense-summary.js";

export const CATEGORY_COLORS = {
  "\u4f4f\u5bbf": "#8a77d9",
  "\u4ea4\u901a": "#62bcae",
  "\u9910\u98f2": "#f5b15f",
  "\u65e5\u7528\u54c1": "#7bb7f0",
  "\u7f8e\u5bb9": "#ff8aa2",
  "\u5a1b\u6a02": "#a88bea",
  "\u8cfc\u7269": "#f45d7d",
  "\u5176\u4ed6": "#8b7f91",
};

export function summarizeDailySpending(trip, activeDate) {
  const expenses = trip.expenseItems || [];
  const members = trip.members || [];
  const dayItems = expenses.filter((expense) => getExpenseDate(expense, trip) === activeDate);
  const todayTotal = sumAmount(dayItems);
  const tripTotal = sumAmount(expenses);
  const categoryTotals = EXPENSE_CATEGORIES.map((category) => {
    const amount = sumAmount(dayItems.filter((expense) => normalizeExpenseCategory(expense.category) === category));
    return {
      category,
      amount,
      color: CATEGORY_COLORS[category] || CATEGORY_COLORS["\u5176\u4ed6"],
      ratio: todayTotal > 0 ? amount / todayTotal : 0,
    };
  }).filter((entry) => entry.amount > 0);
  const topCategory = [...categoryTotals].sort((a, b) => b.amount - a.amount)[0] || null;
  const dailyBudgetBase = Number(trip.dailyBudgetBase || members.length * 2200 || 5000);
  const budgetDelta = dailyBudgetBase - todayTotal;

  return {
    activeDate,
    todayTotal,
    tripTotal,
    averagePerMember: members.length ? todayTotal / members.length : todayTotal,
    topCategory,
    categoryTotals,
    dailyBudgetBase,
    budgetDelta,
    isOverBudget: todayTotal > dailyBudgetBase,
    budgetRatio: dailyBudgetBase > 0 ? todayTotal / dailyBudgetBase : 0,
  };
}

export function buildCategoryPieGradient(categoryTotals) {
  if (!categoryTotals.length) return "conic-gradient(#f1eaff 0deg 360deg)";
  let cursor = 0;
  const segments = categoryTotals.map((entry) => {
    const start = cursor;
    const end = cursor + entry.ratio * 360;
    cursor = end;
    return `${entry.color} ${start.toFixed(1)}deg ${end.toFixed(1)}deg`;
  });
  if (cursor < 360) segments.push(`#fff1f4 ${cursor.toFixed(1)}deg 360deg`);
  return `conic-gradient(${segments.join(", ")})`;
}

function sumAmount(items) {
  return items.reduce((total, item) => total + Number(item.totalBase || 0), 0);
}
