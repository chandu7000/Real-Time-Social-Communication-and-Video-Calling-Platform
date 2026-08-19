import mongoose from "mongoose";
import { URL } from "node:url";

export const PROFILE_PUBLIC_FIELDS = "_id fullName bio profilePic nativeLanguage learningLanguage location isOnboarded createdAt";
export const PROFILE_EDITABLE_FIELDS = ["fullName", "bio", "profilePic", "nativeLanguage", "learningLanguage", "location"];
const limits = { fullName: 80, bio: 300, location: 120, nativeLanguage: 60, learningLanguage: 60, profilePic: 500 };
export const DEFAULT_DISCOVERY_LIMIT = 9;
export const MAX_DISCOVERY_LIMIT = 24;
export function isValidUserId(value) { return typeof value === "string" && mongoose.Types.ObjectId.isValid(value) && String(new mongoose.Types.ObjectId(value)) === value.toLowerCase(); }
export function normalizeProfileText(value) { return typeof value === "string" ? value.trim() : value; }
export function buildProfileUpdatePayload(body = {}) { const payload = {}; for (const field of PROFILE_EDITABLE_FIELDS) { if (field in body) payload[field] = normalizeProfileText(body[field]); } return payload; }
export function validateProfileUpdate(payload) {
  if (!Object.keys(payload).length) return "Provide at least one editable profile field";
  for (const [field, value] of Object.entries(payload)) { if (typeof value !== "string") return `${field} must be a string`; if (value.length > limits[field]) return `${field} is too long`; }
  if ("fullName" in payload && !payload.fullName) return "Full name is required";
  if (payload.profilePic) { try { const url = new URL(payload.profilePic); if (!["http:", "https:"].includes(url.protocol)) return "Profile image must be a valid URL"; } catch { return "Profile image must be a valid URL"; } }
  return null;
}
export function validatePaginationQuery(query = {}, maxLimit = MAX_DISCOVERY_LIMIT) {
  for (const key of ["page", "limit"]) { if (query[key] === undefined) continue; if (!/^\d+$/.test(String(query[key]))) return `${key} must be a positive integer`; if (Number(query[key]) < 1) return `${key} must be a positive integer`; }
  if (query.limit !== undefined && Number(query.limit) > maxLimit) return `limit must not exceed ${maxLimit}`;
  return null;
}
export function parsePagination(query = {}) { const rawPage = Number.parseInt(query.page, 10); const rawLimit = Number.parseInt(query.limit, 10); const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1; const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, MAX_DISCOVERY_LIMIT) : DEFAULT_DISCOVERY_LIMIT; return { page, limit, skip: (page - 1) * limit }; }
export function escapeRegex(value = "") { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
export function buildPaginationMeta({ page, limit, total }) { const totalPages = Math.max(1, Math.ceil(total / limit)); return { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 }; }
