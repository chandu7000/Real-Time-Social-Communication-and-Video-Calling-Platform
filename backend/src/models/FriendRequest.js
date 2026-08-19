import mongoose from "mongoose";
import { buildFriendPairKey, FRIEND_REQUEST_STATUS } from "../utils/friends.js";

const friendRequestSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    pairKey: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(FRIEND_REQUEST_STATUS),
      default: FRIEND_REQUEST_STATUS.PENDING,
    },
  },
  {
    timestamps: true,
  }
);

friendRequestSchema.path("recipient").validate(function (recipient) {
  return !this.sender || String(this.sender) !== String(recipient);
}, "Sender and recipient must be different users");

friendRequestSchema.pre("validate", function setPairKey(next) {
  if (this.sender && this.recipient) {
    this.pairKey = buildFriendPairKey(this.sender, this.recipient);
  }
  next();
});

friendRequestSchema.index(
  { pairKey: 1 },
  {
    unique: true,
    partialFilterExpression: { status: FRIEND_REQUEST_STATUS.PENDING, pairKey: { $type: "string" } },
    name: "unique_pending_friend_pair",
  }
);

const FriendRequest = mongoose.model("FriendRequest", friendRequestSchema);

export default FriendRequest;
