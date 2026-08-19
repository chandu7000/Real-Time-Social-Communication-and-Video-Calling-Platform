import test from "node:test";
import assert from "node:assert/strict";
import { getApiErrorMessage, getAvatarFallback, validateProfileForm } from "../lib/profile.js";

test("profile form trims editable fields and accepts valid data", () => {
  const result = validateProfileForm({
    fullName: "  Zenvio User  ", bio: " Hello ", location: " India ",
    nativeLanguage: "English", learningLanguage: "Spanish",
    profilePic: "https://example.com/avatar.png",
  });
  assert.equal(result.isValid, true);
  assert.equal(result.values.fullName, "Zenvio User");
  assert.equal(result.values.bio, "Hello");
});

test("profile form rejects missing full name and unsafe image URL", () => {
  const result = validateProfileForm({ fullName: "", profilePic: "javascript:alert(1)" });
  assert.equal(result.isValid, false);
  assert.equal(result.errors.fullName, "Full name is required");
  assert.equal(result.errors.profilePic, "Enter a valid image URL");
});

test("profile form enforces practical length limits", () => {
  const result = validateProfileForm({ fullName: "User", bio: "x".repeat(301) });
  assert.match(result.errors.bio, /300/);
});

test("avatar fallback uses first initial safely", () => {
  assert.equal(getAvatarFallback(" chandra"), "C");
  assert.equal(getAvatarFallback(""), "U");
});

test("api error helper prefers backend messages", () => {
  assert.equal(getApiErrorMessage({ response: { data: { message: "Profile not found" } } }), "Profile not found");
});

test("profile form strips unsupported fields from normalized values", () => {
  const result = validateProfileForm({
    fullName: "User",
    password: "should-not-pass-through",
    email: "private@example.com",
    friends: ["unexpected"],
  });
  assert.equal(result.isValid, true);
  assert.equal("password" in result.values, false);
  assert.equal("email" in result.values, false);
  assert.equal("friends" in result.values, false);
});

test("profile form accepts only http and https avatar URLs", () => {
  assert.equal(validateProfileForm({ fullName: "User", profilePic: "http://example.com/a.png" }).isValid, true);
  assert.equal(validateProfileForm({ fullName: "User", profilePic: "https://example.com/a.png" }).isValid, true);
  assert.equal(validateProfileForm({ fullName: "User", profilePic: "ftp://example.com/a.png" }).isValid, false);
});

test("api error helper falls back safely when backend error data is absent", () => {
  assert.equal(getApiErrorMessage(new Error("Network unavailable"), "Fallback"), "Network unavailable");
  assert.equal(getApiErrorMessage(null, "Fallback"), "Fallback");
});
