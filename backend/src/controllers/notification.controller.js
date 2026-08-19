import Notification from "../models/Notification.js";
import {
  NOTIFICATION_ACTOR_FIELDS,
  buildNotificationPagination,
  isValidNotificationId,
  notificationDestination,
  parseNotificationPagination,
  validateNotificationPagination,
} from "../utils/notifications.js";

function success(res, status, payload = {}) {
  return res.status(status).json({ success: true, ...payload });
}

function failure(res, status, message) {
  return res.status(status).json({ success: false, message });
}

function serializeNotification(notification) {
  const item = notification.toObject ? notification.toObject() : { ...notification };
  delete item.__v;
  return {
    ...item,
    destination: notificationDestination(item.type, item.actor?._id || item.actor),
  };
}

export async function getNotifications(req, res) {
  const paginationError = validateNotificationPagination(req.query);
  if (paginationError) return failure(res, 400, paginationError);
  const { page, limit, skip } = parseNotificationPagination(req.query);
  const filter = { recipient: req.user.id };
  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("actor", NOTIFICATION_ACTOR_FIELDS),
    Notification.countDocuments(filter),
  ]);

  return success(res, 200, {
    notifications: notifications.map(serializeNotification),
    pagination: buildNotificationPagination({ page, limit, total }),
  });
}

export async function getUnreadNotificationCount(req, res) {
  const unreadCount = await Notification.countDocuments({ recipient: req.user.id, isRead: false });
  return success(res, 200, { unreadCount });
}

export async function markNotificationRead(req, res) {
  const { id } = req.params;
  if (!isValidNotificationId(id)) return failure(res, 400, "Invalid notification ID");

  const notification = await Notification.findOneAndUpdate(
    { _id: id, recipient: req.user.id },
    { $set: { isRead: true, readAt: new Date() } },
    { new: true }
  ).populate("actor", NOTIFICATION_ACTOR_FIELDS);

  if (!notification) {
    return failure(res, 404, "Notification not found");
  }

  return success(res, 200, { notification: serializeNotification(notification) });
}

export async function markAllNotificationsRead(req, res) {
  const result = await Notification.updateMany(
    { recipient: req.user.id, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
  return success(res, 200, { message: "All notifications marked as read", updatedCount: result.modifiedCount || 0 });
}
