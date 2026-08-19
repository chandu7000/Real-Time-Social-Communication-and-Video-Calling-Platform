import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  RefreshCwIcon,
  UserRoundIcon,
  VideoIcon,
} from "lucide-react";
import {
  Channel,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";
import toast from "react-hot-toast";

import useAuthUser from "../hooks/useAuthUser";
import {
  getChatAccess,
  getStreamToken,
  getUserFriends,
} from "../lib/api";
import {
  getChatErrorMessage,
  isRecoverableChatError,
} from "../lib/chat";
import {
  connectStreamUser,
  getStreamChatClient,
} from "../lib/streamChat";
import ChatLoader from "../components/ChatLoader";
import ProfileAvatar from "../components/ProfileAvatar";
import ChatFriendList from "../components/ChatFriendList";

const ChatPage = () => {
  const { id: targetUserId } = useParams();
  const { authUser } = useAuthUser();

  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [initializationError, setInitializationError] =
    useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [sendingCallLink, setSendingCallLink] =
    useState(false);

  const friendsQuery = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
    enabled: Boolean(authUser),
    staleTime: 30 * 1000,
  });

  const friends = Array.isArray(friendsQuery.data?.friends)
    ? friendsQuery.data.friends
    : [];

  const accessQuery = useQuery({
    queryKey: ["chatAccess", targetUserId],
    queryFn: () => getChatAccess(targetUserId),
    enabled: Boolean(authUser && targetUserId),
    retry: false,
  });

  const tokenQuery = useQuery({
    queryKey: ["streamToken", authUser?._id],
    queryFn: getStreamToken,
    enabled: Boolean(
      authUser && accessQuery.data?.success
    ),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  useEffect(() => {
    let active = true;

    const initializeChat = async () => {
      if (
        !authUser ||
        !accessQuery.data?.channelId ||
        !tokenQuery.data?.token
      ) {
        return;
      }

      setInitializationError(null);

      try {
        const client = getStreamChatClient();

        await connectStreamUser(
          client,
          authUser,
          tokenQuery.data.token
        );

        const currentChannel = client.channel(
          "messaging",
          accessQuery.data.channelId,
          {
            members: [
              authUser._id,
              accessQuery.data.targetUser._id,
            ],
          }
        );

        await currentChannel.watch();
        await currentChannel.markRead();

        if (active) {
          setChatClient(client);
          setChannel(currentChannel);
        }
      } catch (error) {
        if (active) {
          setChatClient(null);
          setChannel(null);
          setInitializationError(error);
        }
      }
    };

    initializeChat();

    return () => {
      active = false;
    };
  }, [
    accessQuery.data,
    authUser,
    tokenQuery.data,
    retryCount,
  ]);

  useEffect(() => {
    setChatClient(null);
    setChannel(null);
    setInitializationError(null);
  }, [targetUserId]);

  useEffect(() => {
    if (!channel || !authUser?._id) return undefined;

    const subscription = channel.on("message.new", async (event) => {
      if (
        event.user?.id &&
        String(event.user.id) !== String(authUser._id) &&
        document.visibilityState === "visible"
      ) {
        try {
          await channel.markRead();
        } catch {
          // Stream will retry read-state synchronization through its normal lifecycle.
        }
      }
    });

    return () => subscription?.unsubscribe?.();
  }, [authUser?._id, channel]);

  const handleRetry = async () => {
    setInitializationError(null);

    await Promise.all([
      accessQuery.refetch(),
      tokenQuery.refetch(),
    ]);

    setRetryCount((count) => count + 1);
  };

  const friend = accessQuery.data?.targetUser;

  const handleVideoCall = async () => {
    if (!channel || sendingCallLink || !friend) {
      return;
    }

    try {
      setSendingCallLink(true);

      const callUrl =
        `${window.location.origin}/call/${friend._id}`;

      await channel.sendMessage({
        text:
          `I've started a video call. Join me here: ${callUrl}`,
      });

      toast.success(
        "Video call link sent successfully!"
      );
    } catch {
      toast.error(
        "Could not send the video call link."
      );
    } finally {
      setSendingCallLink(false);
    }
  };

  const accessError = accessQuery.error;
  const tokenError = tokenQuery.error;

  const activeError =
    accessError ||
    tokenError ||
    initializationError;

  if (
    accessQuery.isPending ||
    (accessQuery.data?.success &&
      tokenQuery.isPending)
  ) {
    return (
      <ChatLoader message="Authorizing conversation..." />
    );
  }

  if (activeError) {
    const recoverable =
      isRecoverableChatError(activeError);

    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="card bg-base-200 shadow-sm max-w-lg w-full">
          <div className="card-body items-center text-center">
            <AlertTriangleIcon
              className="size-10 text-error"
              aria-hidden="true"
            />

            <h1 className="card-title">
              Conversation unavailable
            </h1>

            <p className="opacity-75">
              {getChatErrorMessage(activeError)}
            </p>

            <div className="card-actions mt-3 flex-wrap justify-center">
              <Link
                to="/chats"
                className="btn btn-outline btn-sm"
              >
                <ArrowLeftIcon className="size-4" />
                Back to Chats
              </Link>

              {recoverable && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleRetry}
                >
                  <RefreshCwIcon className="size-4" />
                  Retry
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (
    !chatClient ||
    !channel ||
    !friend
  ) {
    return (
      <ChatLoader message="Connecting to chat..." />
    );
  }

  return (
    <div className="h-[calc(100dvh-8rem)] min-h-[420px] p-2 sm:p-4 lg:h-[calc(100vh-4rem)] lg:min-h-[560px]">
      <div className="h-full max-w-[1500px] mx-auto flex overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm">

        <ChatFriendList
          friends={friends}
          activeFriendId={friend._id}
          isLoading={friendsQuery.isPending}
          isError={friendsQuery.isError}
          onRetry={() => friendsQuery.refetch()}
        />

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-base-300 px-3 py-2 sm:px-4">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                to="/chats"
                className="btn btn-ghost btn-sm btn-circle lg:hidden"
                aria-label="Back to chats"
              >
                <ArrowLeftIcon className="size-5" />
              </Link>

              <ProfileAvatar
                src={friend.profilePic}
                name={friend.fullName}
                className="w-10 h-10"
              />

              <div className="min-w-0">
                <h1 className="font-semibold truncate">
                  {friend.fullName}
                </h1>

                <p className="text-xs opacity-60">
                  Private conversation
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <Link
                to={`/users/${friend._id}`}
                className="btn btn-ghost btn-sm"
                aria-label={`View ${friend.fullName}'s profile`}
              >
                <UserRoundIcon className="size-5" />

                <span className="hidden sm:inline">
                  Profile
                </span>
              </Link>

              <button
                type="button"
                onClick={handleVideoCall}
                disabled={sendingCallLink}
                className="btn btn-success btn-sm text-white"
                aria-label={`Start video call with ${friend.fullName}`}
              >
                {sendingCallLink ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <VideoIcon className="size-5" />
                )}

                <span className="hidden sm:inline">
                  Video Call
                </span>
              </button>
            </div>
          </header>

          <div className="flex-1 min-h-0 min-w-0">
            <Chat client={chatClient}>
              <Channel channel={channel}>
                <div className="h-full w-full flex min-w-0">
                  <Window>
                    <MessageList />
                    <MessageInput focus />
                  </Window>

                  <Thread />
                </div>
              </Channel>
            </Chat>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ChatPage;