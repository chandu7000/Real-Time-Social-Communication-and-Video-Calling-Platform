import test from "node:test";
import assert from "node:assert/strict";

const {
  PROFILE_EDITABLE_FIELDS,
  buildPaginationMeta,
  buildProfileUpdatePayload,
  escapeRegex,
  isValidUserId,
  parsePagination,
  validateProfileUpdate,
  validatePaginationQuery,
} = await import("../utils/profile.js");

test("profile update payload only allows approved fields and trims strings", () => {
  const payload = buildProfileUpdatePayload({
    fullName: "  Zenvio User ",
    bio: " Hello ",
    location: " India ",
    password: "attacker-value",
    email: "private@example.com",
    friends: ["unexpected"],
    isOnboarded: false,
  });

  assert.deepEqual(Object.keys(payload).sort(), ["bio", "fullName", "location"]);
  assert.equal(payload.fullName, "Zenvio User");
  assert.equal("password" in payload, false);
  assert.equal("email" in payload, false);
  assert.equal("friends" in payload, false);
  assert.ok(PROFILE_EDITABLE_FIELDS.includes("profilePic"));
});

test("profile validation requires at least one editable field", () => {
  assert.equal(validateProfileUpdate({}), "Provide at least one editable profile field");
});

test("profile validation rejects invalid types and protected mass-assignment is absent", () => {
  assert.equal(validateProfileUpdate({ bio: 123 }), "bio must be a string");
  const payload = buildProfileUpdatePayload({ password: "secret", email: "a@b.com" });
  assert.deepEqual(payload, {});
});

test("profile validation enforces name and image URL rules", () => {
  assert.equal(validateProfileUpdate({ fullName: "" }), "Full name is required");
  assert.equal(validateProfileUpdate({ profilePic: "javascript:alert(1)" }), "Profile image must be a valid URL");
  assert.equal(validateProfileUpdate({ profilePic: "https://example.com/avatar.png" }), null);
});

test("user id validation handles valid and invalid MongoDB ids", () => {
  assert.equal(isValidUserId("507f1f77bcf86cd799439011"), true);
  assert.equal(isValidUserId("not-an-object-id"), false);
});

test("pagination applies safe defaults and caps large limits", () => {
  assert.deepEqual(parsePagination({}), { page: 1, limit: 9, skip: 0 });
  assert.deepEqual(parsePagination({ page: "3", limit: "12" }), { page: 3, limit: 12, skip: 24 });
  assert.equal(parsePagination({ limit: "1000" }).limit, 24);
});

test("pagination rejects invalid explicit client values", () => {
  assert.equal(validatePaginationQuery({ page: "0" }), "page must be a positive integer");
  assert.equal(validatePaginationQuery({ limit: "1000" }), "limit must not exceed 24");
  assert.equal(validatePaginationQuery({ page: "2", limit: "12" }), null);
});

test("pagination metadata reports next and previous pages", () => {
  assert.deepEqual(buildPaginationMeta({ page: 2, limit: 10, total: 25 }), {
    page: 2,
    limit: 10,
    total: 25,
    totalPages: 3,
    hasNextPage: true,
    hasPreviousPage: true,
  });
});

test("search regex escaping treats special characters literally", () => {
  assert.equal(escapeRegex("A.*(B)"), "A\\.\\*\\(B\\)");
});

test("profile update payload preserves only every approved editable field", () => {
  const payload = buildProfileUpdatePayload({
    fullName: " User ",
    bio: " Bio ",
    profilePic: " https://example.com/current.png ",
    uploadedProfilePic: " https://example.com/photo.png ",
    avatarProfilePic: " https://example.com/avatar.png ",
    profileImageMode: "avatar",
    nativeLanguage: " English ",
    learningLanguage: " Spanish ",
    location: " India ",
    role: "admin",
  });

  assert.deepEqual(
    Object.keys(payload).sort(),
    [...PROFILE_EDITABLE_FIELDS].sort()
  );

  assert.equal(payload.fullName, "User");
  assert.equal(payload.uploadedProfilePic, "https://example.com/photo.png");
  assert.equal(payload.avatarProfilePic, "https://example.com/avatar.png");
  assert.equal(payload.profileImageMode, "avatar");
  assert.equal("role" in payload, false);
});

test("profile validation supports saved photo, avatar, and display mode", () => {
  assert.equal(
    validateProfileUpdate({
      uploadedProfilePic: "https://example.com/photo.png",
      avatarProfilePic: "https://example.com/avatar.svg",
      profileImageMode: "avatar",
    }),
    null
  );

  assert.equal(
    validateProfileUpdate({
      uploadedProfilePic: "javascript:alert(1)",
    }),
    "Profile image must be a valid URL"
  );

  assert.equal(
    validateProfileUpdate({
      avatarProfilePic: "ftp://example.com/avatar.png",
    }),
    "Profile image must be a valid URL"
  );

  assert.equal(
    validateProfileUpdate({
      profileImageMode: "something-else",
    }),
    "Profile image mode must be photo or avatar"
  );
});

test("profile pagination rejects fractional and non-numeric values", () => {
  assert.equal(validatePaginationQuery({ page: "1.5" }), "page must be a positive integer");
  assert.equal(validatePaginationQuery({ limit: "abc" }), "limit must be a positive integer");
});

test("empty discovery pagination metadata remains stable", () => {
  assert.deepEqual(buildPaginationMeta({ page: 1, limit: 9, total: 0 }), {
    page: 1,
    limit: 9,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });
});
