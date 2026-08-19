import test from "node:test";
import assert from "node:assert/strict";
import { getFriendsFromResponse, getOutgoingRequestsFromResponse, relationshipAction } from "../lib/friends.js";

test("friend response helper supports the Phase 5 response contract", () => {
  const friends = [{ _id: "1" }];
  assert.deepEqual(getFriendsFromResponse({ friends }), friends);
  assert.deepEqual(getFriendsFromResponse(friends), friends);
  assert.deepEqual(getFriendsFromResponse(null), []);
});

test("outgoing response helper supports the Phase 5 response contract", () => {
  const outgoingRequests = [{ _id: "request-1" }];
  assert.deepEqual(getOutgoingRequestsFromResponse({ outgoingRequests }), outgoingRequests);
  assert.deepEqual(getOutgoingRequestsFromResponse(outgoingRequests), outgoingRequests);
});

test("relationship action maps backend states to stable UI actions", () => {
  assert.equal(relationshipAction("none"), "add_friend");
  assert.equal(relationshipAction("outgoing_pending"), "request_sent");
  assert.equal(relationshipAction("incoming_pending"), "review_request");
  assert.equal(relationshipAction("friends"), "friends");
});

test("friend response helpers reject malformed collection payloads", () => {
  assert.deepEqual(getFriendsFromResponse({ friends: null }), []);
  assert.deepEqual(getFriendsFromResponse({ friends: "invalid" }), []);
  assert.deepEqual(getOutgoingRequestsFromResponse(null), []);
});

test("unknown relationship states safely fall back to add friend", () => {
  assert.equal(relationshipAction(undefined), "add_friend");
  assert.equal(relationshipAction("unexpected"), "add_friend");
});
