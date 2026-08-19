import test from "node:test";
import assert from "node:assert/strict";

const { buildPrivateCallId, toCallUser, validateCallTarget } = await import("../utils/call.js");

const firstId = "507f1f77bcf86cd799439011";
const secondId = "507f191e810c19729de860ea";

function user(id, friends = []) {
  return { _id: id, fullName: "Test User", profilePic: "avatar.jpg", friends };
}

test("private video call id is deterministic in both directions", () => {
  assert.equal(buildPrivateCallId(firstId, secondId), buildPrivateCallId(secondId, firstId));
  assert.match(buildPrivateCallId(firstId, secondId), /^private-/);
});

test("video call target validation allows symmetric friends", () => {
  assert.equal(
    validateCallTarget({
      currentUserId: firstId,
      targetUserId: secondId,
      currentUser: user(firstId, [secondId]),
      targetUser: user(secondId, [firstId]),
    }),
    null
  );
});

test("video call target validation rejects invalid ids and self calls", () => {
  assert.deepEqual(
    validateCallTarget({ currentUserId: firstId, targetUserId: "invalid" }),
    { status: 400, message: "Invalid user ID" }
  );
  assert.deepEqual(
    validateCallTarget({ currentUserId: firstId, targetUserId: firstId }),
    { status: 400, message: "You cannot start a video call with yourself" }
  );
});

test("video call target validation rejects missing users", () => {
  assert.deepEqual(
    validateCallTarget({
      currentUserId: firstId,
      targetUserId: secondId,
      currentUser: user(firstId),
      targetUser: null,
    }),
    { status: 404, message: "User not found" }
  );
});

test("video call target validation rejects non-friends and removed friendships", () => {
  assert.deepEqual(
    validateCallTarget({
      currentUserId: firstId,
      targetUserId: secondId,
      currentUser: user(firstId, []),
      targetUser: user(secondId, []),
    }),
    { status: 403, message: "You can only video call your friends" }
  );
  assert.deepEqual(
    validateCallTarget({
      currentUserId: firstId,
      targetUserId: secondId,
      currentUser: user(firstId, [secondId]),
      targetUser: user(secondId, []),
    }),
    { status: 403, message: "You can only video call your friends" }
  );
});

test("video call user serialization exposes only safe public fields", () => {
  const safe = toCallUser({
    _id: secondId,
    fullName: "Friend",
    profilePic: "avatar.jpg",
    password: "secret",
    email: "private@example.com",
    friends: [firstId],
  });

  assert.deepEqual(safe, { _id: secondId, fullName: "Friend", profilePic: "avatar.jpg" });
  assert.equal("password" in safe, false);
  assert.equal("email" in safe, false);
  assert.equal("friends" in safe, false);
});

test("video call target validation rejects a removed friendship even when one side is stale", () => {
  assert.deepEqual(
    validateCallTarget({
      currentUserId: firstId,
      targetUserId: secondId,
      currentUser: user(firstId, [secondId]),
      targetUser: user(secondId, []),
    }),
    { status: 403, message: "You can only video call your friends" }
  );
});
