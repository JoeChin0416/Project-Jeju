export const PACKING_CATEGORIES = [
  "證件票券",
  "盥洗用品",
  "衣物穿搭",
  "美妝保養",
  "藥品保健",
  "拍照小物",
];

const DEFAULT_PACKING_NAMES = [
  ["證件票券", "護照"],
  ["證件票券", "身分證"],
  ["證件票券", "機票/訂房資訊"],
  ["證件票券", "信用卡/現金"],
  ["盥洗用品", "牙刷牙膏"],
  ["盥洗用品", "洗面乳"],
  ["盥洗用品", "保養品"],
  ["盥洗用品", "防曬"],
  ["衣物穿搭", "內衣褲"],
  ["衣物穿搭", "睡衣"],
  ["衣物穿搭", "外套/罩衫"],
  ["衣物穿搭", "舒服好走的鞋"],
  ["美妝保養", "底妝"],
  ["美妝保養", "彩妝"],
  ["美妝保養", "卸妝用品"],
  ["藥品保健", "常備藥"],
  ["藥品保健", "暈車藥"],
  ["藥品保健", "OK繃"],
  ["拍照小物", "充電器"],
  ["拍照小物", "行動電源"],
  ["拍照小物", "自拍腳架"],
  ["拍照小物", "轉接頭"],
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
