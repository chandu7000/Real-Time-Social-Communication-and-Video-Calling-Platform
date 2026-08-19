const attempts = new Map();

const cleanupExpiredEntries = (now) => {
  for (const [key, entry] of attempts.entries()) {
    if (entry.resetAt <= now) attempts.delete(key);
  }
};

export const createAuthRateLimiter = ({ windowMs, maxRequests }) => (req, res, next) => {
  const now = Date.now();
  cleanupExpiredEntries(now);

  const key = `${req.ip || req.socket?.remoteAddress || "unknown"}:${req.path}`;
  const current = attempts.get(key);

  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return next();
  }

  if (current.count >= maxRequests) {
    const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    res.set("Retry-After", String(retryAfterSeconds));
    return res.status(429).json({
      success: false,
      message: "Too many authentication attempts. Please try again later.",
    });
  }

  current.count += 1;
  return next();
};

export const resetAuthRateLimitStoreForTests = () => attempts.clear();
