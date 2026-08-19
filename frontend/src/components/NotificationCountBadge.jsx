import useNotificationCount from "../hooks/useNotificationCount";

const NotificationCountBadge = ({ className = "" }) => {
  const { unreadCount } = useNotificationCount();
  if (!unreadCount) return null;

  const label = unreadCount > 99 ? "99+" : String(unreadCount);
  return (
    <span
      className={`badge badge-error badge-sm min-w-5 ${className}`.trim()}
      aria-label={`${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`}
    >
      {label}
    </span>
  );
};

export default NotificationCountBadge;
