import { StreamChat } from "stream-chat";
import { env } from "../config/env.js";

let streamClient;

const getStreamClient = () => {
  if (!env.streamApiKey || !env.streamApiSecret) {
    throw new Error("Stream API configuration is missing");
  }

  if (!streamClient) {
    streamClient = StreamChat.getInstance(env.streamApiKey, env.streamApiSecret);
  }

  return streamClient;
};

export const upsertStreamUser = async (userData) => {
  await getStreamClient().upsertUsers([userData]);
  return userData;
};

export const generateStreamToken = (userId) => getStreamClient().createToken(userId.toString());
