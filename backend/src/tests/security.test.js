import test from "node:test";
import assert from "node:assert/strict";
import { createCorsOptions, SECURITY_HEADERS, securityHeaders } from "../middleware/security.middleware.js";
import { validatePaginationQuery } from "../utils/profile.js";
import { validateNotificationPagination } from "../utils/notifications.js";
import { validateOnboardingInput, validateSignupInput } from "../utils/auth.js";

function runCors(origin, allowed = ["http://localhost:5173"]) {
  return new Promise((resolve) => {
    createCorsOptions({ clientOrigins: allowed }).origin(origin, (error, accepted) => resolve({ error, accepted }));
  });
}

test("security headers apply practical browser protections", () => {
  const headers = new Map();
  securityHeaders({}, { setHeader: (key, value) => headers.set(key, value) }, () => {});
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) assert.equal(headers.get(key), value);
});

test("CORS accepts configured origins and rejects unknown origins", async () => {
  assert.equal((await runCors("http://localhost:5173")).accepted, true);
  assert.equal((await runCors(undefined)).accepted, true);
  const denied = await runCors("https://evil.example");
  assert.equal(denied.accepted, undefined);
  assert.equal(denied.error?.statusCode, 403);
});

test("pagination validation rejects malformed and excessive values", () => {
  assert.equal(validatePaginationQuery({ page: "-1" }), "page must be a positive integer");
  assert.equal(validatePaginationQuery({ limit: "25" }), "limit must not exceed 24");
  assert.equal(validatePaginationQuery({ page: "2", limit: "12" }), null);
  assert.equal(validateNotificationPagination({ limit: "51" }), "limit must not exceed 50");
});

test("authentication inputs enforce practical length limits", () => {
  assert.equal(validateSignupInput({ fullName: "A".repeat(81), email: "a@example.com", password: "secret1" }), "Full name is too long");
  assert.equal(validateSignupInput({ fullName: "Alex", email: "a@example.com", password: "x".repeat(129) }), "Password is too long");
  assert.equal(validateOnboardingInput({ fullName: "Alex", bio: "b".repeat(301), nativeLanguage: "English", learningLanguage: "Spanish", location: "India", profilePic: "" })?.message, "Bio is too long");
});
