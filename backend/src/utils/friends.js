export const FRIEND_PUBLIC_FIELDS =
  "_id fullName bio profilePic nativeLanguage learningLanguage location";

export const FRIEND_REQUEST_STATUS = Object.freeze({
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
});

export const RELATIONSHIP_STATUS = Object.freeze({
  NONE: "none",
  OUTGOING_PENDING: "outgoing_pending",
  INCOMING_PENDING: "incoming_pending",
  FRIENDS: "friends",
});

export function isValidObjectId(value) {
  return typeof value === "string" && /^[a-fA-F0-9]{24}$/.test(value);
}

export function buildFriendPairKey(firstUserId, secondUserId) {
  return [String(firstUserId), String(secondUserId)].sort().join(":");
}

export function idsEqual(first, second) {
  return String(first) === String(second);
}

export function hasFriend(friends = [], userId) {
  if (!Array.isArray(friends)) return false;
  return friends.some((friendId) => idsEqual(friendId?._id || friendId, userId));
}

export function getRelationshipStatus({ currentUserId, targetUserId, friends = [], pendingRequest }) {
  if (hasFriend(friends, targetUserId)) return RELATIONSHIP_STATUS.FRIENDS;
  if (!pendingRequest) return RELATIONSHIP_STATUS.NONE;

  if (idsEqual(pendingRequest.sender, currentUserId)) {
    return RELATIONSHIP_STATUS.OUTGOING_PENDING;
  }
  if (idsEqual(pendingRequest.recipient, currentUserId)) {
    return RELATIONSHIP_STATUS.INCOMING_PENDING;
  }
  return RELATIONSHIP_STATUS.NONE;
}

export function isDuplicateKeyError(error) {
  return error?.code === 11000;
}
