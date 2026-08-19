export function getChatErrorMessage(error) {
  return error?.response?.data?.message || error?.message || "Could not open this conversation.";
}

export function isRecoverableChatError(error) {
  const status = error?.response?.status;
  return !status || status >= 500;
}
