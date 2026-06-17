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
    "3C與拍照",
  ]);
});

test("creates a fuller girls trip packing starter list for each member", () => {
  const items = createDefaultPackingItems(members);
  const ownerIds = new Set(items.map((item) => item.ownerId));
  const names = new Set(items.map((item) => item.name));

  assert.equal(ownerIds.has("m-a"), true);
  assert.equal(ownerIds.has("m-b"), true);
  assert.equal(names.has("護照"), true);
  assert.equal(names.has("牙刷牙膏"), true);
  assert.equal(names.has("電棒捲"), true);
  assert.equal(names.has("離子夾"), true);
  assert.equal(names.has("洋裝 / 裙裝"), true);
  assert.equal(names.has("吹風機"), true);
  assert.equal(names.has("輕便雨衣 / 防風外套"), true);
  assert.equal(names.has("泳衣"), false);
  assert.equal(items.every((item) => PACKING_CATEGORIES.includes(item.category)), true);
  assert.ok(items.length >= members.length * 42);
});
