import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET_KEY ||= "phase3-test-secret";

const {
  buildOnboardingPayload,
  createAuthToken,
  getAuthCookieClearOptions,
  getAuthCookieOptions,
  normalizeEmail,
  toSafeUser,
  validateLoginInput,
  validateSignupInput,
} = await import("../utils/auth.js");
const { env } = await import("../config/env.js");
const { protectRoute } = await import("../middleware/auth.middleware.js");
const { default: User } = await import("../models/User.js");
const {
  createAuthRateLimiter,
  resetAuthRateLimitStoreForTests,
} = await import("../middleware/auth-rate-limit.middleware.js");

afterEach(() => resetAuthRateLimitStoreForTests());

const createResponse = () => {
  const result = { statusCode: 200, body: null, headers: {} };
  return {
    result,
    status(code) {
      result.statusCode = code;
      return this;
    },
    json(body) {
      result.body = body;
      return this;
    },
    set(name, value) {
      result.headers[name] = value;
      return this;
    },
  };
};

test("signup validation normalizes email and rejects invalid input", () => {
  assert.equal(normalizeEmail("  USER@Example.COM  "), "user@example.com");
  assert.equal(
    validateSignupInput({ email: "bad-email", password: "secret1", fullName: "User" }),
    "Invalid email format"
  );
  assert.equal(
    validateSignupInput({ email: "user@example.com", password: "123", fullName: "User" }),
    "Password must be at least 6 characters"
  );
  assert.equal(
    validateSignupInput({ email: "user@example.com", password: "secret1", fullName: "User" }),
    null
  );
});

test("login validation rejects missing or malformed credentials", () => {
  assert.equal(validateLoginInput({ email: "", password: "" }), "Email and password are required");
  assert.equal(validateLoginInput({ email: "invalid", password: "secret1" }), "Invalid email format");
  assert.equal(validateLoginInput({ email: "user@example.com", password: "secret1" }), null);
});

test("safe user serialization removes password and version fields", () => {
  const safe = toSafeUser({ _id: "1", email: "user@example.com", password: "hash", __v: 3 });
  assert.deepEqual(safe, { _id: "1", email: "user@example.com" });
});

test("onboarding payload only allows approved fields", () => {
  const payload = buildOnboardingPayload({
    fullName: " User ",
    bio: " Bio ",
    nativeLanguage: "English",
    learningLanguage: "Spanish",
    location: "India",
    profilePic: "https://example.com/avatar.png",
    isOnboarded: false,
    password: "attacker-value",
    friends: ["unexpected"],
  });

  assert.deepEqual(Object.keys(payload).sort(), [
    "bio",
    "fullName",
    "learningLanguage",
    "location",
    "nativeLanguage",
    "profilePic",
  ]);
  assert.equal(payload.fullName, "User");
  assert.equal("password" in payload, false);
  assert.equal("friends" in payload, false);
  assert.equal("isOnboarded" in payload, false);
});

test("authentication cookie options are HTTP-only and clear options match security settings", () => {
  const options = getAuthCookieOptions();
  const clearOptions = getAuthCookieClearOptions();

  assert.equal(options.httpOnly, true);
  assert.equal(options.path, "/");
  assert.equal(options.secure, false);
  assert.equal(options.sameSite, "lax");
  assert.ok(options.maxAge > 0);
  assert.equal("maxAge" in clearOptions, false);
  assert.equal(clearOptions.httpOnly, options.httpOnly);
  assert.equal(clearOptions.sameSite, options.sameSite);
  assert.equal(clearOptions.secure, options.secure);
  assert.equal(clearOptions.path, options.path);
});

test("created JWT contains the user id and expiration", () => {
  const token = createAuthToken("507f1f77bcf86cd799439011");
  const decoded = jwt.verify(token, env.jwtSecret);

  assert.equal(decoded.userId, "507f1f77bcf86cd799439011");
  assert.equal(typeof decoded.exp, "number");
  assert.ok(decoded.exp > decoded.iat);
});

test("authentication middleware returns controlled 401 for missing token", async () => {
  const req = { cookies: {} };
  const res = createResponse();
  let nextCalled = false;

  await protectRoute(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.result.statusCode, 401);
  assert.equal(res.result.body.success, false);
  assert.match(res.result.body.message, /Authentication required/);
  assert.equal(nextCalled, false);
});

test("authentication middleware returns controlled 401 for malformed token", async () => {
  const req = { cookies: { jwt: "not-a-valid-token" } };
  const res = createResponse();

  await protectRoute(req, res, () => assert.fail("next should not be called"));

  assert.equal(res.result.statusCode, 401);
  assert.match(res.result.body.message, /Invalid authentication token/);
});

test("authentication middleware returns controlled 401 for expired token", async () => {
  const expiredToken = jwt.sign({ userId: "507f1f77bcf86cd799439011" }, env.jwtSecret, {
    expiresIn: -1,
  });
  const req = { cookies: { jwt: expiredToken } };
  const res = createResponse();

  await protectRoute(req, res, () => assert.fail("next should not be called"));

  assert.equal(res.result.statusCode, 401);
  assert.match(res.result.body.message, /expired/i);
});

test("authentication rate limiter blocks requests after the configured limit", () => {
  const limiter = createAuthRateLimiter({ windowMs: 60_000, maxRequests: 2 });
  const req = { ip: "127.0.0.1", path: "/login" };
  let nextCount = 0;

  limiter(req, createResponse(), () => (nextCount += 1));
  limiter(req, createResponse(), () => (nextCount += 1));
  const blockedRes = createResponse();
  limiter(req, blockedRes, () => (nextCount += 1));

  assert.equal(nextCount, 2);
  assert.equal(blockedRes.result.statusCode, 429);
  assert.equal(blockedRes.result.body.success, false);
  assert.ok(blockedRes.result.headers["Retry-After"]);
});

test("signup and login reject overlong credentials without exposing internals", () => {
  assert.equal(
    validateSignupInput({ fullName: "User", email: `${"a".repeat(250)}@x.com`, password: "secret1" }),
    "Invalid email format"
  );
  assert.equal(
    validateLoginInput({ email: "user@example.com", password: "x".repeat(129) }),
    "Password is too long"
  );
});

test("safe user serialization accepts document-like values and null", () => {
  const documentLike = {
    toObject: () => ({ _id: "1", email: "user@example.com", password: "hash", __v: 1 }),
  };
  assert.deepEqual(toSafeUser(documentLike), { _id: "1", email: "user@example.com" });
  assert.equal(toSafeUser(null), null);
});

test("onboarding validation reports missing required fields", async () => {
  const { validateOnboardingInput } = await import("../utils/auth.js");
  const result = validateOnboardingInput({ fullName: "User", bio: "", nativeLanguage: "English", learningLanguage: "", location: "India", profilePic: "" });
  assert.equal(result.message, "All fields are required");
  assert.deepEqual(result.missingFields.sort(), ["bio", "learningLanguage"]);
});

test("authentication middleware prefers a bearer token over a shared cookie", async () => {
  const bearerToken = jwt.sign(
    { userId: "507f1f77bcf86cd799439011" },
    env.jwtSecret,
    { expiresIn: "5m" }
  );
  const req = {
    headers: { authorization: `Bearer ${bearerToken}` },
    cookies: { jwt: "not-a-valid-token" },
  };
  const res = createResponse();
  const originalFindById = User.findById;

  User.findById = () => ({
    select: async () => ({
      _id: "507f1f77bcf86cd799439011",
      fullName: "Bearer User",
    }),
  });

  try {
    let nextCalled = false;
    await protectRoute(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(req.user.fullName, "Bearer User");
  } finally {
    User.findById = originalFindById;
  }
});
