import { useChatUnreadStore } from "../store/useChatUnreadStore";

const ChatUnreadBadge = ({ className = "" }) => {
  const unreadConversationCount = useChatUnreadStore(
    (state) => state.unreadConversationCount
  );

  if (!unreadConversationCount) return null;

  const label = unreadConversationCount > 99 ? "99+" : String(unreadConversationCount);

  return (
    <span
      className={`badge badge-error badge-sm min-w-5 ${className}`.trim()}
      aria-label={`${unreadConversationCount} unread chat conversation${unreadConversationCount === 1 ? "" : "s"}`}
    >
      {label}
    </span>
  );
};

export default ChatUnreadBadge;
