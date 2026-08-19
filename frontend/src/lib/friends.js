export const RELATIONSHIP_STATUS = Object.freeze({
  NONE: "none",
  OUTGOING_PENDING: "outgoing_pending",
  INCOMING_PENDING: "incoming_pending",
  FRIENDS: "friends",
});

export function getFriendsFromResponse(data) {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.friends) ? data.friends : [];
}

export function getOutgoingRequestsFromResponse(data) {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.outgoingRequests) ? data.outgoingRequests : [];
}

export function relationshipAction(status) {
  switch (status) {
    case RELATIONSHIP_STATUS.OUTGOING_PENDING:
      return "request_sent";
    case RELATIONSHIP_STATUS.INCOMING_PENDING:
      return "review_request";
    case RELATIONSHIP_STATUS.FRIENDS:
      return "friends";
    default:
      return "add_friend";
  }
}
