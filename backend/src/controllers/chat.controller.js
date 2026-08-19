import User from "../models/User.js";
import { generateStreamToken } from "../lib/stream.js";
import { buildPrivateChannelId, getAuthenticatedStreamUserId, toChatUser, validateChatTarget } from "../utils/chat.js";

function failure(res, status, message) {
  return res.status(status).json({ success: false, message });
}

export async function getStreamToken(req, res) {
  const token = generateStreamToken(getAuthenticatedStreamUserId(req));
  res.status(200).json({ success: true, token });
}

export async function getChatAccess(req, res) {
  const { id: targetUserId } = req.params;

  if (!/^[a-fA-F0-9]{24}$/.test(targetUserId || "")) {
    return failure(res, 400, "Invalid user ID");
  }

  const [currentUser, targetUser] = await Promise.all([
    User.findById(req.user.id).select("friends"),
    User.findById(targetUserId).select("_id fullName profilePic friends"),
  ]);

  const validationError = validateChatTarget({
    currentUserId: req.user.id,
    targetUserId,
    currentUser,
    targetUser,
  });

  if (validationError) {
    return failure(res, validationError.status, validationError.message);
  }

  return res.status(200).json({
    success: true,
    channelId: buildPrivateChannelId(req.user.id, targetUserId),
    targetUser: toChatUser(targetUser),
  });
}
