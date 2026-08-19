const AUTH_TOKEN_KEY = "zenvioAuthToken";

const getSessionStorage = () => {
  if (typeof window === "undefined" || !window.sessionStorage) return null;
  return window.sessionStorage;
};

export function getAuthSessionToken() {
  return getSessionStorage()?.getItem(AUTH_TOKEN_KEY) || "";
}

export function setAuthSessionToken(token) {
  const storage = getSessionStorage();
  if (!storage || typeof token !== "string" || !token.trim()) return;
  storage.setItem(AUTH_TOKEN_KEY, token.trim());
}

export function clearAuthSessionToken() {
  getSessionStorage()?.removeItem(AUTH_TOKEN_KEY);
}

export function hasAuthSessionToken() {
  return Boolean(getAuthSessionToken());
}
