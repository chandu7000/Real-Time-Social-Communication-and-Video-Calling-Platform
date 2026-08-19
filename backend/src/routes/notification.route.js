import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controllers/notification.controller.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = express.Router();
router.use(protectRoute);

router.get("/", asyncHandler(getNotifications));
router.get("/unread-count", asyncHandler(getUnreadNotificationCount));
router.put("/read-all", asyncHandler(markAllNotificationsRead));
router.put("/:id/read", asyncHandler(markNotificationRead));

export default router;
