import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCallMembers,
  getVideoCallErrorMessage,
  isRecoverableVideoCallError,
} from "../lib/videoCall.js";

test("video call error helper prefers controlled backend messages", () => {
  const error = { response: { data: { message: "You can only video call your friends" } } };
  assert.equal(getVideoCallErrorMessage(error), "You can only video call your friends");
});

test("video call error helper translates browser device permission failures", () => {
  assert.match(
    getVideoCallErrorMessage({ name: "NotAllowedError", message: "Permission denied" }),
    /browser settings/i
  );
  assert.match(
    getVideoCallErrorMessage({ name: "NotFoundError", message: "Requested device not found" }),
    /could not be found/i
  );
});

test("only transient video call failures are retryable", () => {
  assert.equal(isRecoverableVideoCallError({ response: { status: 403 } }), false);
  assert.equal(isRecoverableVideoCallError({ response: { status: 404 } }), false);
  assert.equal(isRecoverableVideoCallError({ response: { status: 500 } }), true);
  assert.equal(isRecoverableVideoCallError(new Error("Network error")), true);
});

test("call member helper contains only the two authorized users", () => {
  assert.deepEqual(buildCallMembers("user-a", "user-b"), [
    { user_id: "user-a" },
    { user_id: "user-b" },
  ]);
});

test("video call error helper handles busy or unreadable devices", () => {
  assert.match(
    getVideoCallErrorMessage({ name: "NotReadableError", message: "Could not start video source" }),
    /already in use/i
  );
});

test("video call authorization failures are not retryable", () => {
  for (const status of [400, 401, 403, 404]) {
    assert.equal(isRecoverableVideoCallError({ response: { status } }), false);
  }
});

test("video call member helper normalizes identifiers without adding participants", () => {
  assert.deepEqual(buildCallMembers(123, 456), [
    { user_id: "123" },
    { user_id: "456" },
  ]);
});
