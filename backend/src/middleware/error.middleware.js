import { env, isProduction } from "../config/env.js";
import { logger } from "../utils/logger.js";

export const notFound = (req, res) => res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });

function normalizeError(error) {
  if (error?.code === 11000) return { statusCode: 409, message: "A conflicting resource already exists" };
  if (error?.name === "ValidationError") return { statusCode: 400, message: "Request data failed validation" };
  if (error?.name === "CastError") return { statusCode: 400, message: "Invalid resource identifier" };
  const statusCode = Number.isInteger(error?.statusCode) ? error.statusCode : Number.isInteger(error?.status) ? error.status : 500;
  return { statusCode, message: error?.message || "Internal Server Error" };
}

export const errorHandler = (error, _req, res, next) => {
  if (res.headersSent) return next(error);
  const normalized = normalizeError(error);
  if (env.nodeEnv !== "test") logger.error("Unexpected request error", error);
  const response = { success: false, message: normalized.statusCode >= 500 && isProduction ? "Internal Server Error" : normalized.message };
  if (env.nodeEnv === "development" && normalized.statusCode >= 500 && error?.stack) response.stack = error.stack;
  return res.status(normalized.statusCode).json(response);
};
