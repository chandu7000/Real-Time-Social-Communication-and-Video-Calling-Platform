import express from "express";
import { login, logout, onboard, signup } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { createAuthRateLimiter } from "../middleware/auth-rate-limit.middleware.js";
import { env } from "../config/env.js";
import { asyncHandler } from "../utils/async-handler.js";
import { toSafeUser } from "../utils/auth.js";

const router = express.Router();

const authRateLimiter = createAuthRateLimiter({
  windowMs: env.authRateLimitWindowMs,
  maxRequests: env.authRateLimitMaxRequests,
});

router.post("/signup", authRateLimiter, asyncHandler(signup));
router.post("/login", authRateLimiter, asyncHandler(login));
router.post("/logout", logout);
router.post("/onboarding", protectRoute, asyncHandler(onboard));

router.get("/me", protectRoute, (req, res) => {
  res.status(200).json({ success: true, user: toSafeUser(req.user) });
});

export default router;
