export const PROFILE_MAX_LENGTHS = {
  fullName: 80,
  bio: 300,
  location: 120,
  nativeLanguage: 60,
  learningLanguage: 60,
  profilePic: 500,
};

export function getApiErrorMessage(error, fallback = "Something went wrong") {
  return error?.response?.data?.message || error?.message || fallback;
}

export function validateProfileForm(values) {
  const errors = {};
  const normalized = {};

  for (const [field, maxLength] of Object.entries(PROFILE_MAX_LENGTHS)) {
    const value = typeof values?.[field] === "string" ? values[field].trim() : "";
    normalized[field] = value;
    if (value.length > maxLength) errors[field] = `Maximum ${maxLength} characters allowed`;
  }

  if (!normalized.fullName) errors.fullName = "Full name is required";

  if (normalized.profilePic) {
    try {
      const url = new URL(normalized.profilePic);
      if (!["http:", "https:"].includes(url.protocol)) errors.profilePic = "Enter a valid image URL";
    } catch {
      errors.profilePic = "Enter a valid image URL";
    }
  }

  return { errors, values: normalized, isValid: Object.keys(errors).length === 0 };
}

export function getAvatarFallback(name = "User") {
  return name.trim().charAt(0).toUpperCase() || "U";
}
