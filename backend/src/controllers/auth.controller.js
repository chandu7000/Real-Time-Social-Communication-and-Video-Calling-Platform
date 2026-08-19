import User from "../models/User.js";
import { upsertStreamUser } from "../lib/stream.js";
import { logger } from "../utils/logger.js";
import {
  AUTH_COOKIE_NAME,
  buildOnboardingPayload,
  createAuthToken,
  getAuthCookieClearOptions,
  getAuthCookieOptions,
  normalizeEmail,
  normalizeText,
  toSafeUser,
  validateLoginInput,
  validateSignupInput,
  validateOnboardingInput,
} from "../utils/auth.js";

export async function signup(req, res) {
  const email = normalizeEmail(req.body?.email);
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const fullName = normalizeText(req.body?.fullName);

  const validationError = validateSignupInput({ email, password, fullName });
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: "Email already exists, please use a different one",
    });
  }

  const avatarIndex = Math.floor(Math.random() * 100) + 1;
  const randomAvatar = `https://avatar.iran.liara.run/public/${avatarIndex}.png`;

  let newUser;
  try {
    newUser = await User.create({ email, fullName, password, profilePic: randomAvatar });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email already exists, please use a different one",
      });
    }
    throw error;
  }

  try {
    await upsertStreamUser({
      id: newUser._id.toString(),
      name: newUser.fullName,
      image: newUser.profilePic || "",
    });
  } catch (error) {
    logger.warn("Unable to create Stream user during signup", error);
  }

  const token = createAuthToken(newUser._id);
  res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
  return res.status(201).json({ success: true, token, user: toSafeUser(newUser) });
}

export async function login(req, res) {
  const email = normalizeEmail(req.body?.email);
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  const validationError = validateLoginInput({ email, password });
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  }

  const token = createAuthToken(user._id);
  res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
  return res.status(200).json({ success: true, token, user: toSafeUser(user) });
}

export function logout(_req, res) {
  res.clearCookie(AUTH_COOKIE_NAME, getAuthCookieClearOptions());
  return res.status(200).json({ success: true, message: "Logout successful" });
}

export async function onboard(req, res) {
  const userId = req.user._id;
  const allowedFields = buildOnboardingPayload(req.body);

  const validationError = validateOnboardingInput(allowedFields);
  if (validationError) {
    return res.status(400).json({ success: false, ...validationError });
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { ...allowedFields, isOnboarded: true },
    { new: true, runValidators: true }
  );

  if (!updatedUser) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  try {
    await upsertStreamUser({
      id: updatedUser._id.toString(),
      name: updatedUser.fullName,
      image: updatedUser.profilePic || "",
    });
  } catch (error) {
    logger.warn("Unable to update Stream user during onboarding", error);
  }

  return res.status(200).json({ success: true, user: toSafeUser(updatedUser) });
}
