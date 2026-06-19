const NUMBER_FIELDS = new Set(["unitPrice", "quantity", "subtotal", "total"]);
const META_FIELDS = new Set(["merchantName", "receiptDate", "currency", "total"]);

export function calculateReceiptTotal(items) {
  return roundMoney(items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0));
}

export function createBlankReceiptItem() {
  return {
    id: crypto.randomUUID(),
    originalName: "",
    translatedName: "",
    category: "\u8cfc\u7269",
    unitPrice: 0,
    quantity: 1,
    subtotal: 0,
    allocations: {},
  };
}

export function updateReceiptDraftItem(draft, itemId, field, value) {
  const items = draft.items.map((item) => {
    if (item.id !== itemId) return item;

    const next = {
      ...item,
      [field]: NUMBER_FIELDS.has(field) ? Number(value || 0) : value,
    };

    if (field === "unitPrice" || field === "quantity") {
      next.subtotal = roundMoney(Number(next.unitPrice || 0) * Number(next.quantity || 0));
    }

    return next;
  });

  return {
    ...draft,
    items,
    total: calculateReceiptTotal(items),
  };
}

export function updateReceiptDraftMeta(draft, field, value) {
  if (!META_FIELDS.has(field)) return draft;

  return {
    ...draft,
    [field]: NUMBER_FIELDS.has(field) ? Number(value || 0) : value,
  };
}

export function getReceiptItemAllocations(item, memberIds = [], payerId = "") {
  const ids = [...new Set(memberIds ?? [])];
  if (ids.length === 0) return {};
  const fallbackId = ids.includes(payerId) ? payerId : ids[0];
  const totalQuantity = normalizeQuantity(item?.quantity || 0);
  const rawAllocations = item?.allocations || {};
  const allocations = Object.fromEntries(ids.map((id) => [id, 0]));
  let nonPayerTotal = 0;

  ids.forEach((id) => {
    if (id === fallbackId) return;
    const value = normalizeQuantity(rawAllocations[id] || 0);
    const available = Math.max(0, totalQuantity - nonPayerTotal);
    allocations[id] = Math.min(value, available);
    nonPayerTotal = roundQuantity(nonPayerTotal + allocations[id]);
  });

  allocations[fallbackId] = Math.max(0, roundQuantity(totalQuantity - nonPayerTotal));
  return allocations;
}

export function updateReceiptItemAllocation(draft, itemId, memberId, value, memberIds = [], payerId = "") {
  const ids = [...new Set(memberIds ?? [])];
  if (!ids.includes(memberId)) return draft;
  const fallbackId = ids.includes(payerId) ? payerId : ids[0];

  return {
    ...draft,
    items: draft.items.map((item) => {
      if (item.id !== itemId) return item;

      const totalQuantity = normalizeQuantity(item.quantity || 0);
      const current = getReceiptItemAllocations(item, ids, fallbackId);
      const allocations = { ...current };
      if (memberId !== fallbackId) {
        const otherNonPayerTotal = ids
          .filter((id) => id !== fallbackId && id !== memberId)
          .reduce((sum, id) => sum + normalizeQuantity(allocations[id] || 0), 0);
        allocations[memberId] = Math.min(normalizeQuantity(value), Math.max(0, totalQuantity - otherNonPayerTotal));
      }

      return {
        ...item,
        allocations: Object.fromEntries(
          ids
            .filter((id) => id !== fallbackId)
            .map((id) => [id, normalizeQuantity(allocations[id] || 0)]),
        ),
      };
    }),
  };
}

export function buildReceiptItemSplit(item, memberIds = [], payerId = "") {
  const allocations = getReceiptItemAllocations(item, memberIds, payerId);
  const splitValues = Object.fromEntries(
    Object.entries(allocations).filter(([, quantity]) => normalizeQuantity(quantity) > 0),
  );
  const participantIds = Object.keys(splitValues);
  return {
    participantIds,
    splitValues,
  };
}

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function normalizeQuantity(value) {
  return roundQuantity(Math.max(0, Number(value || 0)));
}

function roundQuantity(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}
