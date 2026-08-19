import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getChatAccess, getStreamToken } from "../controllers/chat.controller.js";
import { asyncHandler } from "../utils/async-handler.js";
import { createRequestRateLimiter } from "../middleware/request-rate-limit.middleware.js";

const router = express.Router();
const streamTokenLimiter = createRequestRateLimiter({ windowMs: 60_000, maxRequests: 30, message: "Too many Stream token requests. Please try again shortly." });

router.get("/token", protectRoute, streamTokenLimiter, asyncHandler(getStreamToken));
router.get("/access/:id", protectRoute, asyncHandler(getChatAccess));

export default router;
