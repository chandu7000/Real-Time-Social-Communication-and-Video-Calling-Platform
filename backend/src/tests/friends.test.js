import test from "node:test";
import assert from "node:assert/strict";

const {
  FRIEND_REQUEST_STATUS,
  RELATIONSHIP_STATUS,
  buildFriendPairKey,
  getRelationshipStatus,
  hasFriend,
  idsEqual,
  isDuplicateKeyError,
  isValidObjectId,
} = await import("../utils/friends.js");

test("friend pair key is deterministic in both directions", () => {
  const first = "507f1f77bcf86cd799439011";
  const second = "507f191e810c19729de860ea";
  assert.equal(buildFriendPairKey(first, second), buildFriendPairKey(second, first));
});

test("friend helpers safely compare ids and membership", () => {
  const first = "507f1f77bcf86cd799439011";
  const second = "507f191e810c19729de860ea";
  assert.equal(idsEqual(first, first), true);
  assert.equal(idsEqual(first, second), false);
  assert.equal(hasFriend([{ _id: second }], second), true);
  assert.equal(hasFriend([], second), false);
});

test("relationship state reports friends before pending requests", () => {
  const currentUserId = "507f1f77bcf86cd799439011";
  const targetUserId = "507f191e810c19729de860ea";
  const state = getRelationshipStatus({
    currentUserId,
    targetUserId,
    friends: [targetUserId],
    pendingRequest: { sender: currentUserId, recipient: targetUserId },
  });
  assert.equal(state, RELATIONSHIP_STATUS.FRIENDS);
});

test("relationship state distinguishes outgoing and incoming pending requests", () => {
  const currentUserId = "507f1f77bcf86cd799439011";
  const targetUserId = "507f191e810c19729de860ea";
  assert.equal(
    getRelationshipStatus({ currentUserId, targetUserId, pendingRequest: { sender: currentUserId, recipient: targetUserId } }),
    RELATIONSHIP_STATUS.OUTGOING_PENDING
  );
  assert.equal(
    getRelationshipStatus({ currentUserId, targetUserId, pendingRequest: { sender: targetUserId, recipient: currentUserId } }),
    RELATIONSHIP_STATUS.INCOMING_PENDING
  );
});

test("relationship state defaults to none", () => {
  assert.equal(
    getRelationshipStatus({ currentUserId: "1", targetUserId: "2", friends: [], pendingRequest: null }),
    RELATIONSHIP_STATUS.NONE
  );
});

test("friend request statuses include the complete Phase 5 lifecycle", () => {
  assert.deepEqual(Object.values(FRIEND_REQUEST_STATUS).sort(), ["accepted", "cancelled", "pending", "rejected"]);
});

test("friend id and duplicate-key helpers return controlled results", () => {
  assert.equal(isValidObjectId("507f1f77bcf86cd799439011"), true);
  assert.equal(isValidObjectId("invalid"), false);
  assert.equal(isDuplicateKeyError({ code: 11000 }), true);
  assert.equal(isDuplicateKeyError({ code: 42 }), false);
});

test("relationship helper treats one-sided friend data as friends only when supplied by the current-user relation", () => {
  const currentUserId = "507f1f77bcf86cd799439011";
  const targetUserId = "507f191e810c19729de860ea";
  assert.equal(
    getRelationshipStatus({ currentUserId, targetUserId, friends: [{ _id: targetUserId }], pendingRequest: null }),
    RELATIONSHIP_STATUS.FRIENDS
  );
});

test("friend helpers tolerate nullish identifiers without throwing", () => {
  assert.equal(idsEqual(null, undefined), false);
  assert.equal(hasFriend(null, "507f191e810c19729de860ea"), false);
  assert.equal(isValidObjectId(undefined), false);
});
