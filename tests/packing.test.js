import test from "node:test";
import assert from "node:assert/strict";

import { PACKING_CATEGORIES, createDefaultPackingItems } from "../src/features/packing.js";

const members = [
  { id: "m-a", name: "A" },
  { id: "m-b", name: "B" },
];

test("defines practical default packing categories", () => {
  assert.deepEqual(PACKING_CATEGORIES, [
    "證件票券",
    "盥洗用品",
    "衣物穿搭",
    "美妝保養",
    "藥品保健",
    "拍照小物",
  ]);
});

test("creates common packing items for each member", () => {
  const items = createDefaultPackingItems(members);
  const ownerIds = new Set(items.map((item) => item.ownerId));
  const names = new Set(items.map((item) => item.name));

  assert.equal(ownerIds.has("m-a"), true);
  assert.equal(ownerIds.has("m-b"), true);
  assert.equal(names.has("護照"), true);
  assert.equal(names.has("牙刷牙膏"), true);
  assert.equal(names.has("彩妝"), true);
  assert.equal(items.every((item) => PACKING_CATEGORIES.includes(item.category)), true);
});
