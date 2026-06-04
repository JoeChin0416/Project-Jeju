const EPSILON = 0.005;

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function allocateRemainder(shares, participantIds, total) {
  const roundedTotal = roundMoney(Object.values(shares).reduce((sum, value) => sum + value, 0));
  const diff = roundMoney(total - roundedTotal);
  if (Math.abs(diff) >= EPSILON && participantIds.length > 0) {
    const lastId = participantIds[participantIds.length - 1];
    shares[lastId] = roundMoney((shares[lastId] ?? 0) + diff);
  }
  return shares;
}

export function calculateExpenseShares(expense) {
  const total = roundMoney(expense.totalBase);
  const participantIds = [...new Set(expense.participantIds ?? [])];
  if (participantIds.length === 0) return {};

  if (expense.splitMode === "fixed") {
    const shares = Object.fromEntries(
      participantIds.map((id) => [id, roundMoney(expense.splitValues?.[id] ?? 0)]),
    );
    return allocateRemainder(shares, participantIds, total);
  }

  if (expense.splitMode === "ratio") {
    const weights = participantIds.map((id) => Math.max(0, Number(expense.splitValues?.[id] ?? 0)));
    const weightTotal = weights.reduce((sum, value) => sum + value, 0);
    if (weightTotal <= 0) return calculateExpenseShares({ ...expense, splitMode: "equal" });

    const shares = {};
    participantIds.forEach((id, index) => {
      shares[id] = roundMoney((total * weights[index]) / weightTotal);
    });
    return allocateRemainder(shares, participantIds, total);
  }

  const baseShare = roundMoney(total / participantIds.length);
  const shares = Object.fromEntries(participantIds.map((id) => [id, baseShare]));
  return allocateRemainder(shares, participantIds, total);
}

export function optimizeTransfers(netBalances) {
  const creditors = [];
  const debtors = [];

  Object.entries(netBalances).forEach(([memberId, net]) => {
    const amount = roundMoney(net);
    if (amount > EPSILON) creditors.push({ memberId, amount });
    if (amount < -EPSILON) debtors.push({ memberId, amount: Math.abs(amount) });
  });

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transfers = [];
  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];
    const amount = roundMoney(Math.min(creditor.amount, debtor.amount));

    if (amount > EPSILON) {
      transfers.push({ fromId: debtor.memberId, toId: creditor.memberId, amount });
    }

    creditor.amount = roundMoney(creditor.amount - amount);
    debtor.amount = roundMoney(debtor.amount - amount);

    if (creditor.amount <= EPSILON) creditorIndex += 1;
    if (debtor.amount <= EPSILON) debtorIndex += 1;
  }

  return transfers;
}

export function calculateSettlement(members, expenses) {
  const paid = Object.fromEntries(members.map((member) => [member.id, 0]));
  const owed = Object.fromEntries(members.map((member) => [member.id, 0]));

  expenses.forEach((expense) => {
    if (!expense.payerId) return;
    paid[expense.payerId] = roundMoney((paid[expense.payerId] ?? 0) + Number(expense.totalBase || 0));

    const shares = calculateExpenseShares(expense);
    Object.entries(shares).forEach(([memberId, amount]) => {
      owed[memberId] = roundMoney((owed[memberId] ?? 0) + amount);
    });
  });

  const memberIds = [...new Set([...Object.keys(paid), ...Object.keys(owed)])];
  const net = Object.fromEntries(
    memberIds.map((memberId) => [memberId, roundMoney((paid[memberId] ?? 0) - (owed[memberId] ?? 0))]),
  );

  return {
    paid,
    owed,
    net,
    transfers: optimizeTransfers(net),
  };
}

