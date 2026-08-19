export function getChannelOtherMember(channel, currentUserId) {
  const members = Object.values(channel?.state?.members || {});

  return (
    members.find((member) => {
      const memberId = member?.user?.id || member?.user_id;
      return memberId && String(memberId) !== String(currentUserId);
    }) || null
  );
}

export function getChannelLastMessage(channel) {
  const messages = Array.isArray(channel?.state?.messages)
    ? channel.state.messages
    : [];

  return messages[messages.length - 1] || null;
}

export function getLastMessagePreview(message) {
  const text = typeof message?.text === "string" ? message.text.trim() : "";
  if (text) return text;

  if (Array.isArray(message?.attachments) && message.attachments.length > 0) {
    return "Attachment";
  }

  return "Private conversation";
}

export function buildConversationSnapshot(channels = [], currentUserId) {
  const byUserId = {};

  for (const channel of channels) {
    const otherMember = getChannelOtherMember(channel, currentUserId);
    const otherUser = otherMember?.user;
    const otherUserId = otherUser?.id || otherMember?.user_id;

    if (!otherUserId) continue;

    const lastMessage = getChannelLastMessage(channel);
    const unreadMessages = Math.max(0, Number(channel?.countUnread?.() || 0));
    const lastActivityValue =
      lastMessage?.created_at || channel?.data?.last_message_at || channel?.data?.updated_at;
    const lastActivity = lastActivityValue
      ? new Date(lastActivityValue).getTime() || 0
      : 0;

    byUserId[String(otherUserId)] = {
      userId: String(otherUserId),
      fullName: otherUser?.name || "",
      profilePic: otherUser?.image || "",
      hasUnread: unreadMessages > 0,
      lastMessage: getLastMessagePreview(lastMessage),
      lastActivity,
    };
  }

  const unreadConversationCount = Object.values(byUserId).filter(
    (conversation) => conversation.hasUnread
  ).length;

  return { byUserId, unreadConversationCount };
}

export function filterConversationSnapshot(snapshot, allowedUserIds = []) {
  const allowed = new Set(allowedUserIds.map((value) => String(value)));
  const byUserId = {};

  for (const [userId, conversation] of Object.entries(snapshot?.byUserId || {})) {
    if (allowed.has(String(userId))) {
      byUserId[userId] = conversation;
    }
  }

  return {
    byUserId,
    unreadConversationCount: Object.values(byUserId).filter(
      (conversation) => conversation.hasUnread
    ).length,
  };
}
