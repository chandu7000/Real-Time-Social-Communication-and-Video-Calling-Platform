import test from "node:test";
import assert from "node:assert/strict";
import Notification from "../models/Notification.js";
import {
  NOTIFICATION_ACTOR_FIELDS,
  NOTIFICATION_TYPES,
  buildNotificationEventKey,
  buildNotificationPagination,
  isValidNotificationId,
  notificationDestination,
  notificationMessage,
  parseNotificationPagination,
  validateNotificationPagination,
} from "../utils/notifications.js";

const firstId = "507f1f77bcf86cd799439011";
const secondId = "507f191e810c19729de860ea";

test("notification types cover the supported Phase 8 social events", () => {
  assert.deepEqual(Object.values(NOTIFICATION_TYPES).sort(), ["friend_request_accepted", "friend_request_received"]);
});

test("notification event keys are deterministic per event and resource", () => {
  assert.equal(
    buildNotificationEventKey(NOTIFICATION_TYPES.FRIEND_REQUEST_RECEIVED, firstId),
    `friend_request_received:${firstId}`
  );
});

test("notification messages and destinations are controlled", () => {
  assert.equal(notificationMessage(NOTIFICATION_TYPES.FRIEND_REQUEST_RECEIVED, "Alex"), "Alex sent you a friend request");
  assert.equal(notificationMessage(NOTIFICATION_TYPES.FRIEND_REQUEST_ACCEPTED, "Sam"), "Sam accepted your friend request");
  assert.equal(notificationDestination(NOTIFICATION_TYPES.FRIEND_REQUEST_RECEIVED, secondId), "/notifications");
  assert.equal(notificationDestination(NOTIFICATION_TYPES.FRIEND_REQUEST_ACCEPTED, secondId), `/users/${secondId}`);
});

test("notification pagination applies safe defaults and limits", () => {
  assert.deepEqual(parseNotificationPagination({}), { page: 1, limit: 20, skip: 0 });
  assert.deepEqual(parseNotificationPagination({ page: "2", limit: "999" }), { page: 2, limit: 50, skip: 50 });
  assert.deepEqual(buildNotificationPagination({ page: 2, limit: 20, total: 45 }), {
    page: 2,
    limit: 20,
    total: 45,
    totalPages: 3,
    hasPreviousPage: true,
    hasNextPage: true,
  });
});

test("notification pagination rejects invalid explicit client values", () => {
  assert.equal(validateNotificationPagination({ page: "-1" }), "page must be a positive integer");
  assert.equal(validateNotificationPagination({ limit: "51" }), "limit must not exceed 50");
});

test("notification id validation rejects malformed ids", () => {
  assert.equal(isValidNotificationId(firstId), true);
  assert.equal(isValidNotificationId("invalid"), false);
});

test("notification model exposes only intended notification fields and safe actor selection", () => {
  const paths = Object.keys(Notification.schema.paths);
  for (const required of ["recipient", "actor", "type", "message", "resourceId", "eventKey", "isRead", "readAt", "createdAt"]) {
    assert.equal(paths.includes(required), true);
  }
  for (const sensitive of ["password", "jwt", "cookie", "streamToken", "streamSecret"]) {
    assert.equal(paths.includes(sensitive), false);
    assert.equal(NOTIFICATION_ACTOR_FIELDS.includes(sensitive), false);
  }
});

test("unknown notification types use controlled fallback content and destination", () => {
  assert.equal(notificationMessage("unknown", "Alex"), "You have a new notification");
  assert.equal(notificationDestination("unknown", secondId), "/notifications");
});

test("notification pagination rejects fractional and non-numeric values", () => {
  assert.equal(validateNotificationPagination({ page: "1.5" }), "page must be a positive integer");
  assert.equal(validateNotificationPagination({ limit: "abc" }), "limit must be a positive integer");
});

test("empty notification pagination metadata remains stable", () => {
  assert.deepEqual(buildNotificationPagination({ page: 1, limit: 20, total: 0 }), {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  });
});
