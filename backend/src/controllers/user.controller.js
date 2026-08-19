import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
import Notification from "../models/Notification.js";
import { upsertStreamUser } from "../lib/stream.js";
import { uploadProfileImage } from "../lib/cloudinary.js";
import { logger } from "../utils/logger.js";
import {
  PROFILE_PUBLIC_FIELDS,
  buildPaginationMeta,
  buildProfileUpdatePayload,
  escapeRegex,
  isValidUserId,
  parsePagination,
  validateProfileUpdate,
  validatePaginationQuery,
} from "../utils/profile.js";
import {
  FRIEND_PUBLIC_FIELDS,
  FRIEND_REQUEST_STATUS,
  RELATIONSHIP_STATUS,
  buildFriendPairKey,
  getRelationshipStatus,
  hasFriend,
  idsEqual,
  isDuplicateKeyError,
} from "../utils/friends.js";
import {
  NOTIFICATION_TYPES,
  buildNotificationEventKey,
  notificationMessage,
} from "../utils/notifications.js";

function success(res, status, payload = {}) {
  return res.status(status).json({ success: true, ...payload });
}

function failure(res, status, message) {
  return res.status(status).json({ success: false, message });
}

async function getPendingRequestBetween(firstUserId, secondUserId) {
  return FriendRequest.findOne({
    status: FRIEND_REQUEST_STATUS.PENDING,
    $or: [
      { sender: firstUserId, recipient: secondUserId },
      { sender: secondUserId, recipient: firstUserId },
    ],
  }).select("_id sender recipient status");
}

async function attachRelationshipState(users, currentUser) {
  const plainUsers = users.map((user) => (user.toObject ? user.toObject() : user));
  if (!plainUsers.length) return plainUsers;

  const targetIds = plainUsers.map((user) => user._id);
  const pendingRequests = await FriendRequest.find({
    status: FRIEND_REQUEST_STATUS.PENDING,
    $or: [
      { sender: currentUser._id, recipient: { $in: targetIds } },
      { recipient: currentUser._id, sender: { $in: targetIds } },
    ],
  }).select("sender recipient status");

  const requestByTargetId = new Map();
  for (const request of pendingRequests) {
    const targetId = idsEqual(request.sender, currentUser._id) ? request.recipient : request.sender;
    requestByTargetId.set(String(targetId), request);
  }

  return plainUsers.map((user) => ({
    ...user,
    relationshipStatus: getRelationshipStatus({
      currentUserId: currentUser._id,
      targetUserId: user._id,
      friends: currentUser.friends,
      pendingRequest: requestByTargetId.get(String(user._id)),
    }),
  }));
}

export async function getMyProfile(req, res) {
  const user = await User.findById(req.user.id).select(PROFILE_PUBLIC_FIELDS);
  if (!user) return failure(res, 404, "User not found");
  return success(res, 200, { user });
}

export async function updateMyProfile(req, res) {
  const payload = buildProfileUpdatePayload(req.body);
  const validationError = validateProfileUpdate(payload);

  if (validationError) {
    return failure(res, 400, validationError);
  }

  const currentUser = await User.findById(req.user.id).select(
    "uploadedProfilePic avatarProfilePic profileImageMode profilePic"
  );

  if (!currentUser) {
    return failure(res, 404, "User not found");
  }

  const nextUploadedPhoto =
    payload.uploadedProfilePic !== undefined
      ? payload.uploadedProfilePic
      : currentUser.uploadedProfilePic;

  const nextAvatar =
    payload.avatarProfilePic !== undefined
      ? payload.avatarProfilePic
      : currentUser.avatarProfilePic;

  const nextMode =
    payload.profileImageMode !== undefined
      ? payload.profileImageMode
      : currentUser.profileImageMode;

  if (nextMode === "photo" && nextUploadedPhoto) {
    payload.profilePic = nextUploadedPhoto;
  } else if (nextMode === "avatar" && nextAvatar) {
    payload.profilePic = nextAvatar;
  }

  const updatedUser = await User.findByIdAndUpdate(req.user.id, payload, {
    new: true,
    runValidators: true,
  }).select(PROFILE_PUBLIC_FIELDS);

  if (!updatedUser) {
    return failure(res, 404, "User not found");
  }

  if (
    payload.fullName !== undefined ||
    payload.profilePic !== undefined ||
    payload.uploadedProfilePic !== undefined ||
    payload.avatarProfilePic !== undefined ||
    payload.profileImageMode !== undefined
  ) {
    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullName,
        image: updatedUser.profilePic || "",
      });
    } catch (error) {
      logger.warn("Unable to update Stream user during profile update", error);
    }
  }

  return success(res, 200, {
    message: "Profile updated successfully",
    user: updatedUser,
  });
}

export async function getPublicProfile(req, res) {
  const { id } = req.params;
  if (!isValidUserId(id)) return failure(res, 400, "Invalid user ID");

  const [user, currentUser] = await Promise.all([
    User.findById(id).select(PROFILE_PUBLIC_FIELDS),
    User.findById(req.user.id).select("friends"),
  ]);
  if (!user) return failure(res, 404, "User not found");
  if (!currentUser) return failure(res, 404, "User not found");

  const pendingRequest = idsEqual(id, req.user.id)
    ? null
    : await getPendingRequestBetween(req.user.id, id);
  const relationshipStatus = idsEqual(id, req.user.id)
    ? RELATIONSHIP_STATUS.NONE
    : getRelationshipStatus({
      currentUserId: req.user.id,
      targetUserId: id,
      friends: currentUser.friends,
      pendingRequest,
    });

  return success(res, 200, { user, relationshipStatus, pendingRequestId: pendingRequest?._id || null });
}

function buildDiscoveryFilter(req, searchTerm = "") {
  const filter = {
    _id: { $ne: req.user.id, $nin: req.user.friends || [] },
    isOnboarded: true,
  };

  if (searchTerm) filter.fullName = { $regex: escapeRegex(searchTerm), $options: "i" };
  return filter;
}

async function getDiscoveryPage(req, filter, sort) {
  const { page, limit, skip } = parsePagination(req.query);
  const [users, total, currentUser] = await Promise.all([
    User.find(filter).select(PROFILE_PUBLIC_FIELDS).sort(sort).skip(skip).limit(limit),
    User.countDocuments(filter),
    User.findById(req.user.id).select("friends"),
  ]);

  const usersWithRelationship = await attachRelationshipState(users, currentUser || req.user);
  return { users: usersWithRelationship, pagination: buildPaginationMeta({ page, limit, total }) };
}

export async function getRecommendedUsers(req, res) {
  const paginationError = validatePaginationQuery(req.query);
  if (paginationError) return failure(res, 400, paginationError);
  const result = await getDiscoveryPage(req, buildDiscoveryFilter(req), { createdAt: -1 });
  return success(res, 200, result);
}

export async function searchUsers(req, res) {
  const searchTerm = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (!searchTerm) return failure(res, 400, "Search query is required");
  if (searchTerm.length > 80) return failure(res, 400, "Search query is too long");
  const paginationError = validatePaginationQuery(req.query);
  if (paginationError) return failure(res, 400, paginationError);

  const result = await getDiscoveryPage(req, buildDiscoveryFilter(req, searchTerm), { fullName: 1 });
  return success(res, 200, { query: searchTerm, ...result });
}

export async function getMyFriends(req, res) {
  const user = await User.findById(req.user.id)
    .select("friends")
    .populate("friends", FRIEND_PUBLIC_FIELDS);

  if (!user) return failure(res, 404, "User not found");
  return success(res, 200, { friends: user.friends || [] });
}

export async function sendFriendRequest(req, res) {
  const myId = req.user.id;
  const { id: recipientId } = req.params;

  if (!isValidUserId(recipientId)) return failure(res, 400, "Invalid user ID");
  if (idsEqual(myId, recipientId)) return failure(res, 400, "You can't send a friend request to yourself");

  const [sender, recipient] = await Promise.all([
    User.findById(myId).select("friends"),
    User.findById(recipientId).select("friends"),
  ]);
  if (!sender) return failure(res, 404, "User not found");
  if (!recipient) return failure(res, 404, "Recipient not found");

  if (hasFriend(sender.friends, recipientId) || hasFriend(recipient.friends, myId)) {
    return failure(res, 409, "You are already friends with this user");
  }

  const existingRequest = await getPendingRequestBetween(myId, recipientId);
  if (existingRequest) {
    const message = idsEqual(existingRequest.sender, myId)
      ? "Friend request already sent"
      : "This user has already sent you a friend request";
    return failure(res, 409, message);
  }

  try {
    const friendRequest = await FriendRequest.create({
      sender: myId,
      recipient: recipientId,
      pairKey: buildFriendPairKey(myId, recipientId),
      status: FRIEND_REQUEST_STATUS.PENDING,
    });

    await Notification.create({
      recipient: recipientId,
      actor: myId,
      type: NOTIFICATION_TYPES.FRIEND_REQUEST_RECEIVED,
      message: notificationMessage(NOTIFICATION_TYPES.FRIEND_REQUEST_RECEIVED, req.user.fullName),
      resourceId: friendRequest._id,
      eventKey: buildNotificationEventKey(NOTIFICATION_TYPES.FRIEND_REQUEST_RECEIVED, friendRequest._id),
    });

    return success(res, 201, { message: "Friend request sent", friendRequest });
  } catch (error) {
    if (isDuplicateKeyError(error)) return failure(res, 409, "A pending friend request already exists");
    throw error;
  }
}

export async function acceptFriendRequest(req, res) {
  const { id: requestId } = req.params;
  if (!isValidUserId(requestId)) return failure(res, 400, "Invalid request ID");

  const friendRequest = await FriendRequest.findOneAndUpdate(
    { _id: requestId, recipient: req.user.id, status: FRIEND_REQUEST_STATUS.PENDING },
    { $set: { status: FRIEND_REQUEST_STATUS.ACCEPTED } },
    { new: true }
  );

  if (!friendRequest) {
    const existing = await FriendRequest.findById(requestId).select("recipient status");
    if (!existing) return failure(res, 404, "Friend request not found");
    if (!idsEqual(existing.recipient, req.user.id)) return failure(res, 403, "You are not authorized to accept this request");
    return failure(res, 409, "Friend request is no longer pending");
  }

  await Promise.all([
    User.findByIdAndUpdate(friendRequest.sender, { $addToSet: { friends: friendRequest.recipient } }),
    User.findByIdAndUpdate(friendRequest.recipient, { $addToSet: { friends: friendRequest.sender } }),
    Notification.updateOne(
      { eventKey: buildNotificationEventKey(NOTIFICATION_TYPES.FRIEND_REQUEST_RECEIVED, friendRequest._id), recipient: req.user.id },
      { $set: { isRead: true, readAt: new Date() } }
    ),
  ]);

  await Notification.create({
    recipient: friendRequest.sender,
    actor: friendRequest.recipient,
    type: NOTIFICATION_TYPES.FRIEND_REQUEST_ACCEPTED,
    message: notificationMessage(NOTIFICATION_TYPES.FRIEND_REQUEST_ACCEPTED, req.user.fullName),
    resourceId: friendRequest._id,
    eventKey: buildNotificationEventKey(NOTIFICATION_TYPES.FRIEND_REQUEST_ACCEPTED, friendRequest._id),
  });

  return success(res, 200, { message: "Friend request accepted" });
}

export async function rejectFriendRequest(req, res) {
  const { id: requestId } = req.params;
  if (!isValidUserId(requestId)) return failure(res, 400, "Invalid request ID");

  const friendRequest = await FriendRequest.findOneAndUpdate(
    { _id: requestId, recipient: req.user.id, status: FRIEND_REQUEST_STATUS.PENDING },
    { $set: { status: FRIEND_REQUEST_STATUS.REJECTED } },
    { new: true }
  );

  if (!friendRequest) {
    const existing = await FriendRequest.findById(requestId).select("recipient status");
    if (!existing) return failure(res, 404, "Friend request not found");
    if (!idsEqual(existing.recipient, req.user.id)) return failure(res, 403, "You are not authorized to reject this request");
    return failure(res, 409, "Friend request is no longer pending");
  }

  await Notification.updateOne(
    { eventKey: buildNotificationEventKey(NOTIFICATION_TYPES.FRIEND_REQUEST_RECEIVED, friendRequest._id), recipient: req.user.id },
    { $set: { isRead: true, readAt: new Date() } }
  );

  return success(res, 200, { message: "Friend request rejected" });
}

export async function cancelFriendRequest(req, res) {
  const { id: requestId } = req.params;
  if (!isValidUserId(requestId)) return failure(res, 400, "Invalid request ID");

  const friendRequest = await FriendRequest.findOneAndUpdate(
    { _id: requestId, sender: req.user.id, status: FRIEND_REQUEST_STATUS.PENDING },
    { $set: { status: FRIEND_REQUEST_STATUS.CANCELLED } },
    { new: true }
  );

  if (!friendRequest) {
    const existing = await FriendRequest.findById(requestId).select("sender status");
    if (!existing) return failure(res, 404, "Friend request not found");
    if (!idsEqual(existing.sender, req.user.id)) return failure(res, 403, "You are not authorized to cancel this request");
    return failure(res, 409, "Friend request is no longer pending");
  }

  await Notification.deleteOne({
    eventKey: buildNotificationEventKey(NOTIFICATION_TYPES.FRIEND_REQUEST_RECEIVED, friendRequest._id),
    recipient: friendRequest.recipient,
  });

  return success(res, 200, { message: "Friend request cancelled" });
}

export async function removeFriend(req, res) {
  const { id: friendId } = req.params;
  if (!isValidUserId(friendId)) return failure(res, 400, "Invalid user ID");
  if (idsEqual(friendId, req.user.id)) return failure(res, 400, "You cannot remove yourself as a friend");

  const [currentUser, friend] = await Promise.all([
    User.findById(req.user.id).select("friends"),
    User.findById(friendId).select("friends"),
  ]);
  if (!currentUser) return failure(res, 404, "User not found");
  if (!friend) return failure(res, 404, "Friend not found");

  const currentHasFriend = hasFriend(currentUser.friends, friendId);
  const friendHasCurrent = hasFriend(friend.friends, req.user.id);
  if (!currentHasFriend && !friendHasCurrent) return failure(res, 409, "Friendship is already removed");

  await Promise.all([
    User.findByIdAndUpdate(req.user.id, { $pull: { friends: friendId } }),
    User.findByIdAndUpdate(friendId, { $pull: { friends: req.user.id } }),
  ]);

  return success(res, 200, { message: "Friend removed" });
}

export async function getFriendRequests(req, res) {
  const incomingReqs = await FriendRequest.find({
    recipient: req.user.id,
    status: FRIEND_REQUEST_STATUS.PENDING,
  })
    .sort({ createdAt: -1 })
    .populate("sender", FRIEND_PUBLIC_FIELDS);

  const acceptedReqs = await FriendRequest.find({
    sender: req.user.id,
    status: FRIEND_REQUEST_STATUS.ACCEPTED,
  })
    .sort({ updatedAt: -1 })
    .limit(20)
    .populate("recipient", "_id fullName profilePic");

  return success(res, 200, { incomingReqs, acceptedReqs });
}

export async function getOutgoingFriendReqs(req, res) {
  const outgoingRequests = await FriendRequest.find({
    sender: req.user.id,
    status: FRIEND_REQUEST_STATUS.PENDING,
  })
    .sort({ createdAt: -1 })
    .populate("recipient", FRIEND_PUBLIC_FIELDS);

  return success(res, 200, { outgoingRequests });
}

export async function uploadMyProfilePhoto(req, res) {
  if (!req.file?.buffer) {
    return failure(res, 400, "Profile photo is required");
  }

  const uploadResult = await uploadProfileImage(
    req.file.buffer,
    req.user.id
  );

  if (!uploadResult?.secure_url) {
    return failure(res, 500, "Unable to upload profile photo");
  }

  const uploadedProfilePic = uploadResult.secure_url;

  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      uploadedProfilePic,
      profilePic: uploadedProfilePic,
      profileImageMode: "photo",
    },
    {
      new: true,
      runValidators: true,
    }
  ).select(PROFILE_PUBLIC_FIELDS);

  if (!updatedUser) {
    return failure(res, 404, "User not found");
  }

  try {
    await upsertStreamUser({
      id: updatedUser._id.toString(),
      name: updatedUser.fullName,
      image: updatedUser.profilePic || "",
    });
  } catch (error) {
    logger.warn(
      "Unable to update Stream user after profile photo upload",
      error
    );
  }

  return success(res, 200, {
    message: "Profile photo uploaded successfully",
    user: updatedUser,
  });
}