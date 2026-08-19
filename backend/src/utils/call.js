import { hasFriend, idsEqual, isValidObjectId } from "./friends.js";

export function buildPrivateCallId(firstUserId, secondUserId) {
  return `private-${[String(firstUserId), String(secondUserId)].sort().join("-")}`;
}

export function validateCallTarget({ currentUserId, targetUserId, currentUser, targetUser }) {
  if (!isValidObjectId(targetUserId)) {
    return { status: 400, message: "Invalid user ID" };
  }

  if (idsEqual(currentUserId, targetUserId)) {
    return { status: 400, message: "You cannot start a video call with yourself" };
  }

  if (!targetUser || !currentUser) {
    return { status: 404, message: "User not found" };
  }

  const currentHasTarget = hasFriend(currentUser.friends, targetUserId);
  const targetHasCurrent = hasFriend(targetUser.friends, currentUserId);

  if (!currentHasTarget || !targetHasCurrent) {
    return { status: 403, message: "You can only video call your friends" };
  }

  return null;
}

export function toCallUser(user) {
  return {
    _id: user._id,
    fullName: user.fullName,
    profilePic: user.profilePic || "",
  };
}
