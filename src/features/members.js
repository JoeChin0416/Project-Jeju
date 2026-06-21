export const OWNER_EMAILS = ["dpluschin0416@gmail.com"];
export const RETIRED_ACCOUNT_EMAILS = ["joe.chin@joe.com.tw"];

const MEMBER_COLORS = ["#116b63", "#ee6b4d", "#3167b7", "#d99716", "#8a63d2", "#f45d7d", "#62bcae", "#a88bea"];
const PLACEHOLDER_IDS = ["m-a", "m-b", "m-c", "m-d", "m-e"];
const PLACEHOLDER_NAMES = ["A", "B", "C", "D", "E"];

export function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

export function isOwnerEmail(email) {
  return OWNER_EMAILS.includes(normalizeEmail(email));
}

export function isRetiredAccountEmail(email) {
  return RETIRED_ACCOUNT_EMAILS.includes(normalizeEmail(email));
}

export function createMemberForUser(user, data = {}, index = 0) {
  const email = normalizeEmail(data.email || user?.email);
  const name = String(data.name || user?.displayName || email.split("@")[0] || "旅伴").trim();
  const id = data.id || user?.uid || `member-${crypto.randomUUID()}`;
  return {
    id,
    uid: user?.uid || data.uid || "",
    email,
    name,
    color: data.color || MEMBER_COLORS[index % MEMBER_COLORS.length],
    active: true,
    sortOrder: Number(data.sortOrder || index + 1),
    avatarPresetId: data.avatarPresetId || "",
    avatarUrl: data.avatarUrl || "",
  };
}

export function createManualMember(data = {}, index = 0) {
  return createMemberForUser(
    { uid: "", email: data.email || "", displayName: data.name || "" },
    { ...data, id: data.id || `member-${crypto.randomUUID()}` },
    index,
  );
}

export function findMemberForUser(members = [], user) {
  if (!user) return null;
  const uid = String(user.uid || "");
  const email = normalizeEmail(user.email);
  return (members || []).find((member) =>
    (uid && member.uid === uid) || (email && normalizeEmail(member.email) === email)
  ) || null;
}

export function normalizeMemberEmails(members = []) {
  return [...new Set((members || []).map((member) => normalizeEmail(member.email)).filter(isValidEmail))].sort();
}

export function isDefaultPlaceholderMemberSet(members = []) {
  if (!Array.isArray(members) || members.length !== PLACEHOLDER_IDS.length) return false;
  const ids = members.map((member) => member.id);
  const names = members.map((member) => String(member.name || "").trim());
  return PLACEHOLDER_IDS.every((id) => ids.includes(id)) &&
    PLACEHOLDER_NAMES.every((name) => names.includes(name));
}

export function upsertMember(members = [], member) {
  const email = normalizeEmail(member.email);
  const index = members.findIndex((entry) =>
    entry.id === member.id ||
    (member.uid && entry.uid === member.uid) ||
    (email && normalizeEmail(entry.email) === email)
  );
  if (index >= 0) {
    const next = [...members];
    next[index] = { ...next[index], ...member, email };
    return next;
  }
  return [...members, { ...member, email, sortOrder: member.sortOrder || members.length + 1 }];
}

export function removeMemberFromTrip(trip, memberId) {
  const members = (trip.members || []).filter((member) => member.id !== memberId);
  const fallbackPayerId = members[0]?.id || "";
  return {
    ...trip,
    members,
    expenseItems: (trip.expenseItems || []).map((expense) => {
      const participantIds = (expense.participantIds || []).filter((id) => id !== memberId);
      const splitValues = Object.fromEntries(
        Object.entries(expense.splitValues || {}).filter(([id]) => id !== memberId),
      );
      return {
        ...expense,
        payerId: expense.payerId === memberId ? fallbackPayerId : expense.payerId,
        participantIds: participantIds.length > 0 ? participantIds : members.map((member) => member.id),
        splitValues,
      };
    }),
  };
}

export function removeRetiredMembersFromTrip(trip) {
  return (trip.members || [])
    .filter((member) => isRetiredAccountEmail(member.email))
    .reduce((nextTrip, member) => removeMemberFromTrip(nextTrip, member.id), trip);
}
