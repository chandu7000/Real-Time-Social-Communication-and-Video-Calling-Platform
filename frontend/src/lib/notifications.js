export const NOTIFICATION_TYPES = Object.freeze({
  FRIEND_REQUEST_RECEIVED: "friend_request_received",
  FRIEND_REQUEST_ACCEPTED: "friend_request_accepted",
});

export function getNotificationsFromResponse(data) {
  return Array.isArray(data?.notifications) ? data.notifications : Array.isArray(data) ? data : [];
}

export function getUnreadCountFromResponse(data) {
  const value = Number(data?.unreadCount);
  return Number.isInteger(value) && value > 0 ? value : 0;
}

export function getNotificationDestination(notification) {
  if (
    typeof notification?.destination === "string" &&
    notification.destination.startsWith("/") &&
    !notification.destination.startsWith("//")
  ) {
    return notification.destination;
  }
  if (notification?.type === NOTIFICATION_TYPES.FRIEND_REQUEST_ACCEPTED && notification?.actor?._id) {
    return `/users/${notification.actor._id}`;
  }
  return "/notifications";
}

export function formatNotificationTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
