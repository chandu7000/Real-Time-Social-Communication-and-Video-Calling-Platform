import test from "node:test";
import assert from "node:assert/strict";

const { buildPrivateChannelId, getAuthenticatedStreamUserId, toChatUser, validateChatTarget } = await import("../utils/chat.js");

const firstId = "507f1f77bcf86cd799439011";
const secondId = "507f191e810c19729de860ea";

function user(id, friends = []) {
  return { _id: id, fullName: "Test User", profilePic: "https://example.com/avatar.png", friends };
}

test("Stream identity always comes from the authenticated user", () => {
  const req = {
    user: { id: firstId },
    query: { userId: secondId },
    body: { userId: secondId },
  };

  assert.equal(getAuthenticatedStreamUserId(req), firstId);
});

test("private chat channel id is deterministic in both directions", () => {
  assert.equal(buildPrivateChannelId(firstId, secondId), buildPrivateChannelId(secondId, firstId));
});

test("chat target validation allows an existing symmetric friendship", () => {
  const error = validateChatTarget({
    currentUserId: firstId,
    targetUserId: secondId,
    currentUser: user(firstId, [secondId]),
    targetUser: user(secondId, [firstId]),
  });

  assert.equal(error, null);
});

test("chat target validation rejects invalid ids and self chat", () => {
  assert.deepEqual(
    validateChatTarget({ currentUserId: firstId, targetUserId: "invalid" }),
    { status: 400, message: "Invalid user ID" }
  );

  assert.deepEqual(
    validateChatTarget({ currentUserId: firstId, targetUserId: firstId }),
    { status: 400, message: "You cannot start a chat with yourself" }
  );
});

test("chat target validation rejects missing users", () => {
  assert.deepEqual(
    validateChatTarget({ currentUserId: firstId, targetUserId: secondId, currentUser: user(firstId), targetUser: null }),
    { status: 404, message: "User not found" }
  );
});

test("chat target validation rejects non-friends and asymmetric friendships", () => {
  assert.deepEqual(
    validateChatTarget({
      currentUserId: firstId,
      targetUserId: secondId,
      currentUser: user(firstId, []),
      targetUser: user(secondId, []),
    }),
    { status: 403, message: "You can only chat with your friends" }
  );

  assert.deepEqual(
    validateChatTarget({
      currentUserId: firstId,
      targetUserId: secondId,
      currentUser: user(firstId, [secondId]),
      targetUser: user(secondId, []),
    }),
    { status: 403, message: "You can only chat with your friends" }
  );
});

test("chat user serialization exposes only public conversation fields", () => {
  const safeUser = toChatUser({
    _id: secondId,
    fullName: "Friend",
    profilePic: "avatar.jpg",
    password: "secret",
    email: "private@example.com",
    friends: [firstId],
  });

  assert.deepEqual(safeUser, {
    _id: secondId,
    fullName: "Friend",
    profilePic: "avatar.jpg",
  });
  assert.equal("password" in safeUser, false);
  assert.equal("email" in safeUser, false);
  assert.equal("friends" in safeUser, false);
});

test("chat target validation rejects a removed friendship even when one side is stale", () => {
  assert.deepEqual(
    validateChatTarget({
      currentUserId: firstId,
      targetUserId: secondId,
      currentUser: user(firstId, [secondId]),
      targetUser: user(secondId, []),
    }),
    { status: 403, message: "You can only chat with your friends" }
  );
});
