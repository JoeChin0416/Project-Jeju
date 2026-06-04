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

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}
