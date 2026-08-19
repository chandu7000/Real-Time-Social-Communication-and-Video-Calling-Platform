import mongoose from "mongoose";

export const NOTIFICATION_TYPES = Object.freeze({ FRIEND_REQUEST_RECEIVED: "friend_request_received", FRIEND_REQUEST_ACCEPTED: "friend_request_accepted" });
export const NOTIFICATION_ACTOR_FIELDS = "_id fullName profilePic";
export const DEFAULT_NOTIFICATION_LIMIT = 20;
export const MAX_NOTIFICATION_LIMIT = 50;
export function isValidNotificationId(value) { return typeof value === "string" && mongoose.Types.ObjectId.isValid(value) && String(new mongoose.Types.ObjectId(value)) === value.toLowerCase(); }
export function validateNotificationPagination(query = {}) {
  for (const key of ["page", "limit"]) { if (query[key] === undefined) continue; if (!/^\d+$/.test(String(query[key])) || Number(query[key]) < 1) return `${key} must be a positive integer`; }
  if (query.limit !== undefined && Number(query.limit) > MAX_NOTIFICATION_LIMIT) return `limit must not exceed ${MAX_NOTIFICATION_LIMIT}`;
  return null;
}
export function parseNotificationPagination(query = {}) { const rawPage = Number.parseInt(query.page, 10); const rawLimit = Number.parseInt(query.limit, 10); const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1; const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, MAX_NOTIFICATION_LIMIT) : DEFAULT_NOTIFICATION_LIMIT; return { page, limit, skip: (page - 1) * limit }; }
export function buildNotificationPagination({ page, limit, total }) { const totalPages = Math.max(1, Math.ceil(total / limit)); return { page, limit, total, totalPages, hasPreviousPage: page > 1, hasNextPage: page < totalPages }; }
export function buildNotificationEventKey(type, resourceId) { return `${type}:${String(resourceId)}`; }
export function notificationMessage(type, actorName = "Someone") { if (type === NOTIFICATION_TYPES.FRIEND_REQUEST_RECEIVED) return `${actorName} sent you a friend request`; if (type === NOTIFICATION_TYPES.FRIEND_REQUEST_ACCEPTED) return `${actorName} accepted your friend request`; return "You have a new notification"; }
export function notificationDestination(type, actorId) { if (type === NOTIFICATION_TYPES.FRIEND_REQUEST_RECEIVED) return "/notifications"; if (type === NOTIFICATION_TYPES.FRIEND_REQUEST_ACCEPTED && actorId) return `/users/${actorId}`; return "/notifications"; }
