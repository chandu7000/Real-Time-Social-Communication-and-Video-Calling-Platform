import test from "node:test";
import assert from "node:assert/strict";
import {
  NOTIFICATION_TYPES,
  formatNotificationTime,
  getNotificationDestination,
  getNotificationsFromResponse,
  getUnreadCountFromResponse,
} from "../lib/notifications.js";

test("notification response helper safely reads the Phase 8 list contract", () => {
  const notifications = [{ _id: "notification-1" }];
  assert.deepEqual(getNotificationsFromResponse({ notifications }), notifications);
  assert.deepEqual(getNotificationsFromResponse(notifications), notifications);
  assert.deepEqual(getNotificationsFromResponse(null), []);
});

test("unread count helper rejects invalid values and keeps valid counts", () => {
  assert.equal(getUnreadCountFromResponse({ unreadCount: 4 }), 4);
  assert.equal(getUnreadCountFromResponse({ unreadCount: "2" }), 2);
  assert.equal(getUnreadCountFromResponse({ unreadCount: -1 }), 0);
  assert.equal(getUnreadCountFromResponse({ unreadCount: "invalid" }), 0);
});

test("notification navigation uses safe application destinations", () => {
  assert.equal(
    getNotificationDestination({ type: NOTIFICATION_TYPES.FRIEND_REQUEST_RECEIVED }),
    "/notifications"
  );
  assert.equal(
    getNotificationDestination({ type: NOTIFICATION_TYPES.FRIEND_REQUEST_ACCEPTED, actor: { _id: "user-2" } }),
    "/users/user-2"
  );
  assert.equal(getNotificationDestination({ destination: "https://unsafe.example" }), "/notifications");
});

test("notification timestamp helper handles valid and invalid input", () => {
  assert.equal(typeof formatNotificationTime("2026-08-18T06:00:00.000Z"), "string");
  assert.equal(formatNotificationTime("not-a-date"), "");
  assert.equal(formatNotificationTime(null), "");
});

test("notification navigation rejects protocol-relative and external destinations", () => {
  assert.equal(getNotificationDestination({ destination: "//unsafe.example/path" }), "/notifications");
  assert.equal(getNotificationDestination({ destination: "javascript:alert(1)" }), "/notifications");
});

test("notification response helper rejects malformed list payloads", () => {
  assert.deepEqual(getNotificationsFromResponse({ notifications: "invalid" }), []);
  assert.deepEqual(getNotificationsFromResponse({}), []);
});

test("unread count helper handles zero, decimals, and missing values safely", () => {
  assert.equal(getUnreadCountFromResponse({ unreadCount: 0 }), 0);
  assert.equal(getUnreadCountFromResponse({ unreadCount: 2.5 }), 0);
  assert.equal(getUnreadCountFromResponse({}), 0);
});
