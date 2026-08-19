import { env } from "../config/env.js";

const SECURITY_HEADERS = Object.freeze({
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(self), microphone=(self), geolocation=()",
  "Cross-Origin-Resource-Policy": "same-site",
});

export function securityHeaders(_req, res, next) {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    res.setHeader(name, value);
  }
  next();
}

export function createCorsOptions(config = env) {
  const allowedOrigins = new Set(config.clientOrigins || [config.clientOrigin].filter(Boolean));

  return {
    credentials: true,
    origin(origin, callback) {
      // Requests without an Origin header are allowed so same-origin navigation,
      // health checks, CLI clients, and server-to-server requests keep working.
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      const error = new Error("Origin is not allowed by CORS policy");
      error.statusCode = 403;
      return callback(error);
    },
  };
}

export { SECURITY_HEADERS };
