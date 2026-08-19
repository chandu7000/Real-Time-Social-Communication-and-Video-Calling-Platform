import User from "../models/User.js";
import { generateStreamToken } from "../lib/stream.js";
import { buildPrivateCallId, toCallUser, validateCallTarget } from "../utils/call.js";

function failure(res, status, message) {
  return res.status(status).json({ success: false, message });
}

export async function getVideoCallAccess(req, res) {
  const { id: targetUserId } = req.params;

  const [currentUser, targetUser] = await Promise.all([
    User.findById(req.user.id).select("friends"),
    /^[a-fA-F0-9]{24}$/.test(targetUserId || "")
      ? User.findById(targetUserId).select("_id fullName profilePic friends")
      : Promise.resolve(null),
  ]);

  const validationError = validateCallTarget({
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
    token: generateStreamToken(String(req.user.id)),
    callId: buildPrivateCallId(req.user.id, targetUserId),
    targetUser: toCallUser(targetUser),
  });
}
