import jwt from "jsonwebtoken";
import { env, isProduction } from "../config/env.js";

export const AUTH_COOKIE_NAME = "jwt";
export const AUTH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
export const AUTH_LIMITS = Object.freeze({ fullName: 80, email: 254, password: 128, bio: 300, language: 60, location: 120, profilePic: 500 });

export const getAuthCookieOptions = () => ({ httpOnly: true, secure: isProduction, sameSite: isProduction ? "none" : "lax", maxAge: AUTH_COOKIE_MAX_AGE_MS, path: "/" });
export const getAuthCookieClearOptions = () => { const options = getAuthCookieOptions(); delete options.maxAge; return options; };
export const createAuthToken = (userId) => jwt.sign({ userId: userId.toString() }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
export const normalizeEmail = (email) => typeof email === "string" ? email.trim().toLowerCase() : "";
export const normalizeText = (value) => typeof value === "string" ? value.trim() : "";
export const buildOnboardingPayload = (body = {}) => ({ fullName: normalizeText(body.fullName), bio: normalizeText(body.bio), nativeLanguage: normalizeText(body.nativeLanguage), learningLanguage: normalizeText(body.learningLanguage), location: normalizeText(body.location), profilePic: normalizeText(body.profilePic) });
export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const validateSignupInput = ({ email, password, fullName }) => {
  if (!fullName || !email || !password) return "All fields are required";
  if (fullName.length > AUTH_LIMITS.fullName) return "Full name is too long";
  if (email.length > AUTH_LIMITS.email || !isValidEmail(email)) return "Invalid email format";
  if (password.length < 6) return "Password must be at least 6 characters";
  if (password.length > AUTH_LIMITS.password) return "Password is too long";
  return null;
};

export const validateLoginInput = ({ email, password }) => {
  if (!email || !password) return "Email and password are required";
  if (email.length > AUTH_LIMITS.email || !isValidEmail(email)) return "Invalid email format";
  if (password.length > AUTH_LIMITS.password) return "Password is too long";
  return null;
};

export const validateOnboardingInput = (payload) => {
  const requiredFields = ["fullName", "bio", "nativeLanguage", "learningLanguage", "location"];
  const missingFields = requiredFields.filter((field) => !payload[field]);
  if (missingFields.length) return { message: "All fields are required", missingFields };
  if (payload.fullName.length > AUTH_LIMITS.fullName) return { message: "Full name is too long" };
  if (payload.bio.length > AUTH_LIMITS.bio) return { message: "Bio is too long" };
  if (payload.nativeLanguage.length > AUTH_LIMITS.language || payload.learningLanguage.length > AUTH_LIMITS.language) return { message: "Language value is too long" };
  if (payload.location.length > AUTH_LIMITS.location) return { message: "Location is too long" };
  if (payload.profilePic.length > AUTH_LIMITS.profilePic) return { message: "Profile image URL is too long" };
  return null;
};

export const toSafeUser = (user) => {
  if (!user) return null;
  const value = typeof user.toObject === "function" ? user.toObject() : { ...user };
  delete value.password; delete value.__v; return value;
};
