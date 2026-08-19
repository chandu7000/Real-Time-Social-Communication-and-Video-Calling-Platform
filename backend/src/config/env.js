import "dotenv/config";

const DEFAULT_PORT = 7001;
const DEFAULT_CLIENT_ORIGIN = "http://localhost:5173";
const REQUIRED_ENV_KEYS = ["mongoUri", "jwtSecret", "streamApiKey", "streamApiSecret"];

const parseClientOrigins = (value) => {
  const origins = String(value || DEFAULT_CLIENT_ORIGIN)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  return [...new Set(origins)];
};

const parsePort = (value) => {
  const port = Number(value ?? DEFAULT_PORT);
  return Number.isInteger(port) && port > 0 ? port : DEFAULT_PORT;
};

const clientOrigins = parseClientOrigins(process.env.CLIENT_ORIGIN);

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || "development",
  port: parsePort(process.env.PORT),
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET_KEY,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  authRateLimitWindowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  authRateLimitMaxRequests: Number(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS) || 10,
  streamApiKey: process.env.STREAM_API_KEY,
  streamApiSecret: process.env.STREAM_API_SECRET,
  clientOrigin: clientOrigins[0],
  clientOrigins,
});

export const isProduction = env.nodeEnv === "production";

export const validateEnvironment = (config = env) => {
  const missing = REQUIRED_ENV_KEYS.filter((key) => {
    const value = config[key];
    return typeof value !== "string" || value.trim() === "";
  });

  if (missing.length > 0) {
    throw new Error(`Missing required environment configuration: ${missing.join(", ")}`);
  }

  return config;
};
