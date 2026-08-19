const stores = new Set();

function getClientKey(req) {
  return req.user?.id ? `user:${req.user.id}` : `ip:${req.ip || req.socket?.remoteAddress || "unknown"}`;
}

export function createRequestRateLimiter({ windowMs, maxRequests, message }) {
  const attempts = new Map();
  stores.add(attempts);

  return (req, res, next) => {
    const now = Date.now();
    const key = `${getClientKey(req)}:${req.baseUrl}${req.route?.path || req.path}`;
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
        message: message || "Too many requests. Please try again later.",
      });
    }

    current.count += 1;
    return next();
  };
}

export function resetRequestRateLimitStoresForTests() {
  for (const store of stores) store.clear();
}
