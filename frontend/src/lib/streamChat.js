import { StreamChat } from "stream-chat";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

export function getStreamChatClient() {
  if (!STREAM_API_KEY) {
    throw new Error("Stream Chat configuration is missing");
  }

  return StreamChat.getInstance(STREAM_API_KEY);
}

export async function connectStreamUser(
  client,
  authUser,
  token
) {
  if (
    client.userID &&
    client.userID !== authUser._id
  ) {
    await client.disconnectUser();
  }

  if (!client.userID) {
    await client.connectUser(
      {
        id: authUser._id,
        name: authUser.fullName,
        image: authUser.profilePic || "",
      },
      token
    );
  }

  return client;
}

export function getStreamChannelMemberUser(
  channel,
  userId
) {
  if (!channel || !userId) {
    return null;
  }

  return (
    channel.state?.members?.[String(userId)]?.user || null
  );
}

export function subscribeToStreamUserPresence(
  channel,
  userId,
  onChange
) {
  if (
    !channel ||
    !userId ||
    typeof onChange !== "function"
  ) {
    return () => {};
  }

  const targetUserId = String(userId);

  const currentUser =
    getStreamChannelMemberUser(
      channel,
      targetUserId
    );

  onChange(currentUser);

  const subscription = channel.on(
    "user.presence.changed",
    (event) => {
      if (
        String(event.user?.id || "") !== targetUserId
      ) {
        return;
      }

      onChange(event.user || null);
    }
  );

  return () => {
    subscription?.unsubscribe?.();
  };
}

export async function disconnectStreamUser() {
  if (!STREAM_API_KEY) {
    return;
  }

  const client =
    StreamChat.getInstance(STREAM_API_KEY);

  if (client.userID) {
    await client.disconnectUser();
  }
}