import { hasFriend, idsEqual, isValidObjectId } from "./friends.js";

export function getAuthenticatedStreamUserId(req) {
  return String(req.user.id);
}

export function buildPrivateChannelId(firstUserId, secondUserId) {
  return [String(firstUserId), String(secondUserId)].sort().join("-");
}

export function validateChatTarget({ currentUserId, targetUserId, currentUser, targetUser }) {
  if (!isValidObjectId(targetUserId)) {
    return { status: 400, message: "Invalid user ID" };
  }

  if (idsEqual(currentUserId, targetUserId)) {
    return { status: 400, message: "You cannot start a chat with yourself" };
  }

  if (!targetUser) {
    return { status: 404, message: "User not found" };
  }

  if (!currentUser) {
    return { status: 404, message: "User not found" };
  }

  const currentHasTarget = hasFriend(currentUser.friends, targetUserId);
  const targetHasCurrent = hasFriend(targetUser.friends, currentUserId);

  if (!currentHasTarget || !targetHasCurrent) {
    return { status: 403, message: "You can only chat with your friends" };
  }

  return null;
}

export function toChatUser(user) {
  return {
    _id: user._id,
    fullName: user.fullName,
    profilePic: user.profilePic || "",
  };
}
