export const PACKING_CATEGORIES = [
  "證件票券",
  "盥洗用品",
  "衣物穿搭",
  "美妝保養",
  "藥品保健",
  "3C與拍照",
];

const DEFAULT_PACKING_NAMES = [
  ["證件票券", "護照"],
  ["證件票券", "身分證"],
  ["證件票券", "機票 / 登機資訊"],
  ["證件票券", "住宿訂房資訊"],
  ["證件票券", "旅遊保險資料"],
  ["證件票券", "信用卡 / 現金"],
  ["證件票券", "韓元零錢包"],
  ["證件票券", "駕照 / 國際駕照"],
  ["證件票券", "租車預約資料"],

  ["盥洗用品", "牙刷牙膏"],
  ["盥洗用品", "洗面乳"],
  ["盥洗用品", "卸妝用品"],
  ["盥洗用品", "洗髮精 / 潤髮乳"],
  ["盥洗用品", "沐浴乳"],
  ["盥洗用品", "保養品"],
  ["盥洗用品", "防曬"],
  ["盥洗用品", "護唇膏"],
  ["盥洗用品", "化妝棉 / 棉花棒"],
  ["盥洗用品", "生理用品"],
  ["盥洗用品", "濕紙巾 / 衛生紙"],

  ["衣物穿搭", "內衣褲"],
  ["衣物穿搭", "襪子"],
  ["衣物穿搭", "睡衣"],
  ["衣物穿搭", "上衣"],
  ["衣物穿搭", "下身 / 牛仔褲"],
  ["衣物穿搭", "洋裝 / 裙裝"],
  ["衣物穿搭", "薄外套 / 罩衫"],
  ["衣物穿搭", "厚外套"],
  ["衣物穿搭", "舒適好走的鞋"],
  ["衣物穿搭", "拖鞋 / 涼鞋"],
  ["衣物穿搭", "帽子"],
  ["衣物穿搭", "墨鏡"],
  ["衣物穿搭", "輕便雨衣 / 防風外套"],
  ["衣物穿搭", "穿搭小包"],
  ["衣物穿搭", "飾品 / 耳環"],

  ["美妝保養", "底妝"],
  ["美妝保養", "彩妝"],
  ["美妝保養", "刷具 / 粉撲"],
  ["美妝保養", "香水 / 髮香噴霧"],
  ["美妝保養", "髮圈 / 髮夾"],
  ["美妝保養", "電棒捲"],
  ["美妝保養", "離子夾"],
  ["美妝保養", "吹風機"],
  ["美妝保養", "髮油 / 護髮素"],
  ["美妝保養", "面膜"],

  ["藥品保健", "常備藥"],
  ["藥品保健", "暈車藥"],
  ["藥品保健", "止痛藥"],
  ["藥品保健", "腸胃藥"],
  ["藥品保健", "OK繃"],
  ["藥品保健", "人工淚液"],
  ["藥品保健", "防蚊液"],
  ["藥品保健", "個人處方藥"],

  ["3C與拍照", "手機充電器"],
  ["3C與拍照", "行動電源"],
  ["3C與拍照", "轉接頭"],
  ["3C與拍照", "充電線"],
  ["3C與拍照", "相機 / 拍立得"],
  ["3C與拍照", "記憶卡"],
  ["3C與拍照", "自拍腳架"],
  ["3C與拍照", "耳機"],
  ["3C與拍照", "AirTag / 行李定位器"],
  ["3C與拍照", "購物袋 / 折疊袋"],
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
