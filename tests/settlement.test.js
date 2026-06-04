import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateExpenseShares,
  calculateSettlement,
  optimizeTransfers,
} from "../src/features/settlement.js";

const members = [
  { id: "a", name: "A" },
  { id: "b", name: "B" },
  { id: "c", name: "C" },
];

test("splits an expense equally by default", () => {
  const shares = calculateExpenseShares({
    totalBase: 300,
    participantIds: ["a", "b", "c"],
    splitMode: "equal",
    splitValues: {},
  });

  assert.deepEqual(shares, { a: 100, b: 100, c: 100 });
});

test("splits an expense by ratio", () => {
  const shares = calculateExpenseShares({
    totalBase: 400,
    participantIds: ["a", "b", "c"],
    splitMode: "ratio",
    splitValues: { a: 1, b: 2, c: 1 },
  });

  assert.deepEqual(shares, { a: 100, b: 200, c: 100 });
});

test("uses manual fixed split values", () => {
  const shares = calculateExpenseShares({
    totalBase: 500,
    participantIds: ["a", "b", "c"],
    splitMode: "fixed",
    splitValues: { a: 100, b: 150, c: 250 },
  });

  assert.deepEqual(shares, { a: 100, b: 150, c: 250 });
});

test("calculates optimized transfers from payer and owed balances", () => {
  const expenses = [
    {
      payerId: "a",
      totalBase: 100,
      participantIds: ["b"],
      splitMode: "fixed",
      splitValues: { b: 100 },
    },
    {
      payerId: "b",
      totalBase: 200,
      participantIds: ["c"],
      splitMode: "fixed",
      splitValues: { c: 200 },
    },
    {
      payerId: "c",
      totalBase: 300,
      participantIds: ["a"],
      splitMode: "fixed",
      splitValues: { a: 300 },
    },
  ];

  const settlement = calculateSettlement(members, expenses);

  assert.deepEqual(settlement.net, { a: -200, b: 100, c: 100 });
  assert.deepEqual(settlement.transfers, [
    { fromId: "a", toId: "b", amount: 100 },
    { fromId: "a", toId: "c", amount: 100 },
  ]);
});

test("optimizes reciprocal balances into the fewest obvious transfers", () => {
  const transfers = optimizeTransfers({ a: -300, b: 120, c: 180 });

  assert.deepEqual(transfers, [
    { fromId: "a", toId: "c", amount: 180 },
    { fromId: "a", toId: "b", amount: 120 },
  ]);
});
