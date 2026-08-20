import { formatChatDate } from "../lib/presence";

const ChatDateSeparator = ({
  date,
  unread = false,
}) => {
  const label = formatChatDate(date);

  if (!label) {
    return null;
  }

  return (
    <div
      className="flex w-full items-center gap-3 px-4 py-4 sm:px-6"
      role="separator"
      aria-label={label}
    >
      <div className="h-px min-w-0 flex-1 bg-base-300" />

      <span
        className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold ${
          unread
            ? "border-primary/30 bg-primary/10 text-primary"
            : "border-base-300 bg-base-100 text-base-content/55"
        }`}
      >
        {label}
      </span>

      <div className="h-px min-w-0 flex-1 bg-base-300" />
    </div>
  );
};

export default ChatDateSeparator;