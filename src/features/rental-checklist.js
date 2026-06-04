const RENTAL_CHECKLIST_ITEMS = [
  { id: "insurance", label: "確認租車保險方案與自負額" },
  { id: "pickup-damage", label: "取車時拍攝車身既有損傷" },
  { id: "fuel", label: "確認加油種類與滿油取還規則" },
  { id: "refuel", label: "還車前完成加油並保留收據" },
  { id: "return", label: "確認還車時間、地點與接駁方式" },
];

export function createRentalChecklist() {
  return RENTAL_CHECKLIST_ITEMS.map((item) => ({ ...item, checked: false }));
}

export function normalizeRentalChecklist(items = []) {
  const saved = new Map((items || []).map((item) => [item.id, item]));
  return RENTAL_CHECKLIST_ITEMS.map((item) => ({
    ...item,
    checked: Boolean(saved.get(item.id)?.checked),
  }));
}

export function toggleRentalChecklistItem(items = [], itemId) {
  return normalizeRentalChecklist(items).map((item) => (
    item.id === itemId ? { ...item, checked: !item.checked } : item
  ));
}
