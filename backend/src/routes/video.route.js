import express from "express";
import { getVideoCallAccess } from "../controllers/video.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = express.Router();

router.get("/access/:id", protectRoute, asyncHandler(getVideoCallAccess));

export default router;
