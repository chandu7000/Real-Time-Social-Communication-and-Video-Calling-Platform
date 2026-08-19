import test from "node:test";
import assert from "node:assert/strict";
import { getChatErrorMessage, isRecoverableChatError } from "../lib/chat.js";

test("chat error helper prefers controlled backend messages", () => {
  const error = { response: { data: { message: "You can only chat with your friends" } } };
  assert.equal(getChatErrorMessage(error), "You can only chat with your friends");
});

test("chat error helper falls back safely", () => {
  assert.equal(getChatErrorMessage(new Error("Network unavailable")), "Network unavailable");
  assert.equal(getChatErrorMessage(null), "Could not open this conversation.");
});

test("only network and server chat failures are considered recoverable", () => {
  assert.equal(isRecoverableChatError({ response: { status: 403 } }), false);
  assert.equal(isRecoverableChatError({ response: { status: 404 } }), false);
  assert.equal(isRecoverableChatError({ response: { status: 500 } }), true);
  assert.equal(isRecoverableChatError(new Error("Network error")), true);
});

test("chat authorization failures remain non-retryable", () => {
  assert.equal(isRecoverableChatError({ response: { status: 400 } }), false);
  assert.equal(isRecoverableChatError({ response: { status: 401 } }), false);
  assert.equal(isRecoverableChatError({ response: { status: 403 } }), false);
  assert.equal(isRecoverableChatError({ response: { status: 404 } }), false);
});

test("chat error helper does not expose missing internal response details", () => {
  assert.equal(getChatErrorMessage({ response: { status: 500, data: {} } }), "Could not open this conversation.");
});
