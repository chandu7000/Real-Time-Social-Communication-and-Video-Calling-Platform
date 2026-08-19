import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { env } from "../config/env.js";
import { AUTH_COOKIE_NAME } from "../utils/auth.js";

const unauthorized = (res, message) => res.status(401).json({ success: false, message });

export const protectRoute = async (req, res, next) => {
  const token = req.cookies?.[AUTH_COOKIE_NAME];

  if (!token) {
    return unauthorized(res, "Authentication required");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch (error) {
    if (error?.name === "TokenExpiredError") {
      return unauthorized(res, "Authentication expired. Please sign in again.");
    }
    if (error?.name === "JsonWebTokenError" || error?.name === "NotBeforeError") {
      return unauthorized(res, "Invalid authentication token");
    }
    return next(error);
  }

  if (!decoded?.userId) {
    return unauthorized(res, "Invalid authentication token");
  }

  try {
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return unauthorized(res, "Authentication account no longer exists");
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
};
