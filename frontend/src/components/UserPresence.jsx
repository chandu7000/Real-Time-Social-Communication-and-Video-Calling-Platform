import {
  formatUserPresence,
  isUserOnline,
} from "../lib/presence";

const UserPresence = ({
  user,
  className = "",
  fallbackText = null,
  showDot = true,
}) => {
  const label =
    formatUserPresence(user) ||
    fallbackText;

  if (!label) {
    return null;
  }

  const online = isUserOnline(user);

  return (
    <div
      className={`flex min-w-0 items-center gap-1.5 text-xs ${className}`}
    >
      {showDot && (
        <span
          className={`size-2 shrink-0 rounded-full ${
            online
              ? "bg-success"
              : "bg-base-content/30"
          }`}
          aria-hidden="true"
        />
      )}

      <span
        className={
          online
            ? "truncate font-medium text-success"
            : "truncate opacity-60"
        }
      >
        {label}
      </span>
    </div>
  );
};

export default UserPresence;