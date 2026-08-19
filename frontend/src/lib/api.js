import { axiosInstance } from "./axios";

export const signup = async (signupData) => {
  const response = await axiosInstance.post("/auth/signup", signupData);
  return response.data;
};

export const login = async (loginData) => {
  const response = await axiosInstance.post("/auth/login", loginData);
  return response.data;
};
export const logout = async () => {
  const response = await axiosInstance.post("/auth/logout");
  return response.data;
};

export const getAuthUser = async () => {
  try {
    const res = await axiosInstance.get("/auth/me");
    return res.data;
  } catch (error) {
    console.log("Error in getAuthUser:", error);
    return null;
  }
};

export const completeOnboarding = async (userData) => {
  const response = await axiosInstance.post("/auth/onboarding", userData);
  return response.data;
};

export async function getUserFriends() {
  const response = await axiosInstance.get("/users/friends");
  return response.data;
}

export async function removeFriend(userId) {
  const response = await axiosInstance.delete(`/users/friends/${userId}`);
  return response.data;
}

export async function getRecommendedUsers({ page = 1, limit = 9 } = {}) {
  const response = await axiosInstance.get("/users", { params: { page, limit } });
  return response.data;
}

export async function getOutgoingFriendReqs() {
  const response = await axiosInstance.get("/users/outgoing-friend-requests");
  return response.data;
}

export async function sendFriendRequest(userId) {
  const response = await axiosInstance.post(`/users/friend-request/${userId}`);
  return response.data;
}

export async function getFriendRequests() {
  const response = await axiosInstance.get("/users/friend-requests");
  return response.data;
}

export async function acceptFriendRequest(requestId) {
  const response = await axiosInstance.put(`/users/friend-request/${requestId}/accept`);
  return response.data;
}

export async function rejectFriendRequest(requestId) {
  const response = await axiosInstance.put(`/users/friend-request/${requestId}/reject`);
  return response.data;
}

export async function cancelFriendRequest(requestId) {
  const response = await axiosInstance.delete(`/users/friend-request/${requestId}`);
  return response.data;
}

export async function getStreamToken() {
  const response = await axiosInstance.get("/chat/token");
  return response.data;
}

export async function getChatAccess(userId) {
  const response = await axiosInstance.get(`/chat/access/${userId}`);
  return response.data;
}

export async function getVideoCallAccess(userId) {
  const response = await axiosInstance.get(`/video/access/${userId}`);
  return response.data;
}


export async function getMyProfile() {
  const response = await axiosInstance.get("/users/me");
  return response.data;
}

export async function updateMyProfile(profileData) {
  const response = await axiosInstance.put("/users/me", profileData);
  return response.data;
}

export async function getPublicProfile(userId) {
  const response = await axiosInstance.get(`/users/${userId}`);
  return response.data;
}

export async function searchUsers({ query, page = 1, limit = 9 }) {
  const response = await axiosInstance.get("/users/search", {
    params: { q: query, page, limit },
  });
  return response.data;
}

export async function getNotifications({ page = 1, limit = 20 } = {}) {
  const response = await axiosInstance.get("/notifications", { params: { page, limit } });
  return response.data;
}

export async function getUnreadNotificationCount() {
  const response = await axiosInstance.get("/notifications/unread-count");
  return response.data;
}

export async function markNotificationRead(notificationId) {
  const response = await axiosInstance.put(`/notifications/${notificationId}/read`);
  return response.data;
}

export async function markAllNotificationsRead() {
  const response = await axiosInstance.put("/notifications/read-all");
  return response.data;
}

export async function uploadMyProfilePhoto(file) {
  const formData = new FormData();

  formData.append("profilePhoto", file);

  const response = await axiosInstance.post(
    "/users/me/profile-photo",
    formData
  );

  return response.data;
}