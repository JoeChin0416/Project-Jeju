import { calculateExpenseShares } from "./settlement.js";

export function getExpenseDate(expense, trip) {
  return expense.expenseDate || expense.receiptDate || expense.createdAt?.slice(0, 10) || trip?.startDate || "";
}

export function listExpenseDates(trip) {
  const dates = new Set();
  (trip.itineraryDays || []).forEach((day) => {
    if (day.date) dates.add(day.date);
  });
  (trip.expenseItems || []).forEach((expense) => {
    const date = getExpenseDate(expense, trip);
    if (date) dates.add(date);
  });
  return [...dates].sort();
}

export function calculateMemberExpenseSummary(members, expenses) {
  const summary = Object.fromEntries(
    members.map((member) => [member.id, { paid: 0, spent: 0, net: 0 }]),
  );

  expenses.forEach((expense) => {
    if (expense.payerId) {
      ensureMember(summary, expense.payerId).paid = roundMoney(
        ensureMember(summary, expense.payerId).paid + Number(expense.totalBase || 0),
      );
    }

    const shares = calculateExpenseShares(expense);
    Object.entries(shares).forEach(([memberId, amount]) => {
      ensureMember(summary, memberId).spent = roundMoney(ensureMember(summary, memberId).spent + amount);
    });
  });

  Object.values(summary).forEach((entry) => {
    entry.net = roundMoney(entry.paid - entry.spent);
  });

  return summary;
}

function ensureMember(summary, memberId) {
  if (!summary[memberId]) summary[memberId] = { paid: 0, spent: 0, net: 0 };
  return summary[memberId];
}

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

