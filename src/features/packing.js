export const PACKING_CATEGORIES = [
  "證件票券",
  "盥洗用品",
  "衣物配件",
  "電子用品",
  "藥品保健",
  "旅行雜物",
];

const DEFAULT_PACKING_NAMES = [
  ["證件票券", "護照"],
  ["證件票券", "機票與訂房資料"],
  ["證件票券", "海外旅遊保險"],
  ["盥洗用品", "牙刷牙膏"],
  ["盥洗用品", "洗髮沐浴用品"],
  ["盥洗用品", "保養品與化妝品"],
  ["衣物配件", "上衣"],
  ["衣物配件", "褲裙"],
  ["衣物配件", "內衣襪子"],
  ["衣物配件", "睡衣"],
  ["電子用品", "手機充電器"],
  ["電子用品", "行動電源"],
  ["電子用品", "轉接插頭"],
  ["藥品保健", "常備藥"],
  ["藥品保健", "暈車藥"],
  ["旅行雜物", "雨具"],
  ["旅行雜物", "購物袋"],
];

export function createDefaultPackingItems(members) {
  return (members || []).flatMap((member) => createPackingItemsForOwner(member.id));
}

export function createPersonalPackingItems(ownerId) {
  return createPackingItemsForOwner(ownerId || "demo-user");
}

export function groupPackingByCategory(items) {
  return PACKING_CATEGORIES.map((category) => ({
    category,
    items: (items || []).filter((item) => item.category === category),
  })).filter((group) => group.items.length > 0);
}

function createPackingItemsForOwner(ownerId) {
  return DEFAULT_PACKING_NAMES.map(([category, name], index) => ({
    id: crypto.randomUUID(),
    ownerId,
    category,
    name,
    checked: false,
    sortOrder: index + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}
