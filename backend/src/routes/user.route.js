import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  getFriendRequests,
  getMyFriends,
  getMyProfile,
  getOutgoingFriendReqs,
  getPublicProfile,
  getRecommendedUsers,
  rejectFriendRequest,
  removeFriend,
  searchUsers,
  sendFriendRequest,
  updateMyProfile,
  uploadMyProfilePhoto,
} from "../controllers/user.controller.js";
import { asyncHandler } from "../utils/async-handler.js";
import { createRequestRateLimiter } from "../middleware/request-rate-limit.middleware.js";
import { uploadProfilePhoto } from "../middleware/upload.middleware.js";

const router = express.Router();
const friendRequestLimiter = createRequestRateLimiter({ windowMs: 60_000, maxRequests: 20, message: "Too many friend requests. Please try again shortly." });
router.use(protectRoute);

router.get("/me", asyncHandler(getMyProfile));
router.put("/me", asyncHandler(updateMyProfile));
router.get("/search", asyncHandler(searchUsers));
router.get("/friends", asyncHandler(getMyFriends));
router.get("/friend-requests", asyncHandler(getFriendRequests));
router.get("/outgoing-friend-requests", asyncHandler(getOutgoingFriendReqs));
router.post("/friend-request/:id", friendRequestLimiter, asyncHandler(sendFriendRequest));
router.put("/friend-request/:id/accept", asyncHandler(acceptFriendRequest));
router.put("/friend-request/:id/reject", asyncHandler(rejectFriendRequest));
router.delete("/friend-request/:id", asyncHandler(cancelFriendRequest));
router.delete("/friends/:id", asyncHandler(removeFriend));
router.get("/:id", asyncHandler(getPublicProfile));
router.get("/", asyncHandler(getRecommendedUsers));
router.post(
  "/me/profile-photo",
  uploadProfilePhoto,
  asyncHandler(uploadMyProfilePhoto)
);
export default router;
