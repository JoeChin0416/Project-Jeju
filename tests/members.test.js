import test from "node:test";
import assert from "node:assert/strict";

import {
  createMemberForUser,
  findMemberForUser,
  isDefaultPlaceholderMemberSet,
  isNonMemberAdminEmail,
  isOwnerEmail,
  normalizeMemberEmails,
  needsTripMemberRole,
  removeMemberFromTrip,
  removeRetiredMembersFromTrip,
} from "../src/features/members.js";

test("detects and removes the old A-E placeholder member set", () => {
  const placeholders = ["A", "B", "C", "D", "E"].map((name, index) => ({
    id: `m-${name.toLowerCase()}`,
    name,
    sortOrder: index + 1,
  }));

  assert.equal(isDefaultPlaceholderMemberSet(placeholders), true);
  assert.equal(isDefaultPlaceholderMemberSet([{ id: "real", name: "Joy" }]), false);
});

test("creates and finds the signed-in user's trip role", () => {
  const user = {
    uid: "uid-1",
    email: " Friend@Gmail.com ",
    displayName: "Friend",
  };
  const member = createMemberForUser(
    user,
    { name: "旅伴 Joy", avatarPresetId: "jeju-girl-rose", avatarUrl: "https://example.com/me.jpg" },
    2,
  );

  assert.equal(member.uid, "uid-1");
  assert.equal(member.email, "friend@gmail.com");
  assert.equal(member.name, "旅伴 Joy");
  assert.equal(member.avatarPresetId, "jeju-girl-rose");
  assert.equal(member.avatarUrl, "https://example.com/me.jpg");
  assert.equal(findMemberForUser([member], { uid: "uid-1", email: "other@gmail.com" }).id, member.id);
  assert.equal(findMemberForUser([member], { uid: "other", email: "FRIEND@gmail.com" }).id, member.id);
});

test("removing a member also removes split references from expenses", () => {
  const trip = {
    members: [
      { id: "a", name: "A", email: "a@example.com" },
      { id: "b", name: "B", email: "b@example.com" },
    ],
    expenseItems: [
      {
        id: "e1",
        payerId: "b",
        participantIds: ["a", "b"],
        splitValues: { a: 1, b: 1 },
      },
    ],
  };

  const removed = removeMemberFromTrip(trip, "b");

  assert.deepEqual(removed.members.map((member) => member.id), ["a"]);
  assert.equal(removed.expenseItems[0].payerId, "a");
  assert.deepEqual(removed.expenseItems[0].participantIds, ["a"]);
  assert.deepEqual(removed.expenseItems[0].splitValues, { a: 1 });
});

test("member emails are normalized for access rules", () => {
  assert.deepEqual(
    normalizeMemberEmails([
      { email: " B@Example.com " },
      { email: "a@example.com" },
      { email: "" },
    ]),
    ["a@example.com", "b@example.com"],
  );
});

test("non-member admin account is not treated as an owner", () => {
  assert.equal(isOwnerEmail("joe.chin@joe.com.tw"), false);
  assert.equal(isNonMemberAdminEmail("joe.chin@joe.com.tw"), true);
  assert.equal(isOwnerEmail("dpluschin0416@gmail.com"), true);
});

test("non-member admin can use the app without creating a trip role", () => {
  const members = [{ id: "friend", email: "friend@example.com", uid: "friend-uid" }];

  assert.equal(
    needsTripMemberRole(members, { uid: "admin-uid", email: "joe.chin@joe.com.tw" }),
    false,
  );
  assert.equal(
    needsTripMemberRole(members, { uid: "new-uid", email: "new@example.com" }),
    true,
  );
  assert.equal(
    needsTripMemberRole(members, { uid: "friend-uid", email: "friend@example.com" }),
    false,
  );
});

test("removes non-member admin roles from the trip and existing expenses", () => {
  const trip = {
    members: [
      { id: "joe", name: "Joe test", email: "joe.chin@joe.com.tw" },
      { id: "friend", name: "Friend", email: "friend@example.com" },
    ],
    expenseItems: [
      {
        id: "expense-1",
        payerId: "joe",
        participantIds: ["joe", "friend"],
        splitValues: { joe: 1, friend: 1 },
      },
    ],
  };

  const cleaned = removeRetiredMembersFromTrip(trip);

  assert.deepEqual(cleaned.members.map((member) => member.id), ["friend"]);
  assert.equal(cleaned.expenseItems[0].payerId, "friend");
  assert.deepEqual(cleaned.expenseItems[0].participantIds, ["friend"]);
  assert.deepEqual(cleaned.expenseItems[0].splitValues, { friend: 1 });
});
