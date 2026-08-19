export function getVideoCallErrorMessage(error) {
  const backendMessage = error?.response?.data?.message;
  if (backendMessage) return backendMessage;

  const name = String(error?.name || "").toLowerCase();
  const message = String(error?.message || "");
  const normalized = `${name} ${message}`.toLowerCase();

  if (normalized.includes("notallowederror") || normalized.includes("permission")) {
    return "Camera or microphone permission was denied. Allow access in your browser settings and retry.";
  }

  if (normalized.includes("notfounderror") || normalized.includes("device not found")) {
    return "A camera or microphone could not be found. Check your connected devices and retry.";
  }

  if (normalized.includes("notreadableerror") || normalized.includes("could not start video source")) {
    return "Your camera or microphone is unavailable or already in use by another application.";
  }

  if (message) return message;
  return "Could not start the video call. Please try again.";
}

export function isRecoverableVideoCallError(error) {
  const status = error?.response?.status;
  if ([400, 401, 403, 404].includes(status)) return false;
  return true;
}

export function buildCallMembers(currentUserId, targetUserId) {
  return [{ user_id: String(currentUserId) }, { user_id: String(targetUserId) }];
}
