export const EXPENSE_CATEGORIES = [
  "\u4f4f\u5bbf",
  "\u4ea4\u901a",
  "\u9910\u98f2",
  "\u65e5\u7528\u54c1",
  "\u7f8e\u5bb9",
  "\u5a1b\u6a02",
  "\u8cfc\u7269",
  "\u5176\u4ed6",
];

export function normalizeExpenseCategory(category) {
  return EXPENSE_CATEGORIES.includes(category) ? category : "\u5176\u4ed6";
}
