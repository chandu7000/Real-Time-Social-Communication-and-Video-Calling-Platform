import test, { afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";

const createSessionStorage = () => {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
  };
};

beforeEach(() => {
  globalThis.window = { sessionStorage: createSessionStorage() };
});

afterEach(() => {
  delete globalThis.window;
});

const {
  clearAuthSessionToken,
  getAuthSessionToken,
  hasAuthSessionToken,
  setAuthSessionToken,
} = await import("../lib/authSession.js");

test("tab auth session stores and clears the current tab token", () => {
  assert.equal(getAuthSessionToken(), "");
  assert.equal(hasAuthSessionToken(), false);

  setAuthSessionToken(" token-a ");
  assert.equal(getAuthSessionToken(), "token-a");
  assert.equal(hasAuthSessionToken(), true);

  clearAuthSessionToken();
  assert.equal(getAuthSessionToken(), "");
  assert.equal(hasAuthSessionToken(), false);
});

test("tab auth session does not accept an empty token", () => {
  setAuthSessionToken("   ");
  assert.equal(getAuthSessionToken(), "");
});
