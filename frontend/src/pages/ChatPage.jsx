import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
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
  subscribeToStreamUserPresence,
} from "../lib/streamChat";

import ChatLoader from "../components/ChatLoader";
import ProfileAvatar from "../components/ProfileAvatar";
import ChatFriendList from "../components/ChatFriendList";
import ChatDateSeparator from "../components/ChatDateSeparator";
import UserPresence from "../components/UserPresence";
import VideoCallInviteMessage from "../components/VideoCallInviteMessage";

const ChatPage = () => {
  const { id: targetUserId } = useParams();

  const navigate = useNavigate();

  const { authUser } = useAuthUser();

  const [chatClient, setChatClient] =
    useState(null);

  const [channel, setChannel] =
    useState(null);

  const [
    initializationError,
    setInitializationError,
  ] = useState(null);

  const [retryCount, setRetryCount] =
    useState(0);

  const [
    sendingCallInvite,
    setSendingCallInvite,
  ] = useState(false);

  const [
    showCallConfirm,
    setShowCallConfirm,
  ] = useState(false);

  const [
    friendPresence,
    setFriendPresence,
  ] = useState(null);

  const friendsQuery = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
    enabled: Boolean(authUser),
    staleTime: 30 * 1000,
  });

  const friends = Array.isArray(
    friendsQuery.data?.friends
  )
    ? friendsQuery.data.friends
    : [];

  const accessQuery = useQuery({
    queryKey: [
      "chatAccess",
      targetUserId,
    ],

    queryFn: () =>
      getChatAccess(targetUserId),

    enabled: Boolean(
      authUser &&
        targetUserId
    ),

    retry: false,
  });

  const tokenQuery = useQuery({
    queryKey: [
      "streamToken",
      authUser?._id,
    ],

    queryFn: getStreamToken,

    enabled: Boolean(
      authUser &&
        accessQuery.data?.success
    ),

    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const friend =
    accessQuery.data?.targetUser;

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
        const client =
          getStreamChatClient();

        await connectStreamUser(
          client,
          authUser,
          tokenQuery.data.token
        );

        const currentChannel =
          client.channel(
            "messaging",
            accessQuery.data.channelId,
            {
              members: [
                authUser._id,
                accessQuery.data
                  .targetUser._id,
              ],
            }
          );

        await currentChannel.watch({
          presence: true,
        });

        await currentChannel.markRead();

        if (active) {
          setChatClient(client);
          setChannel(
            currentChannel
          );
        }
      } catch (error) {
        if (active) {
          setChatClient(null);
          setChannel(null);

          setInitializationError(
            error
          );
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
    setFriendPresence(null);
    setInitializationError(null);
    setShowCallConfirm(false);
  }, [targetUserId]);

  useEffect(() => {
    if (
      !channel ||
      !friend?._id
    ) {
      setFriendPresence(null);

      return undefined;
    }

    return subscribeToStreamUserPresence(
      channel,
      friend._id,
      setFriendPresence
    );
  }, [
    channel,
    friend?._id,
  ]);

  useEffect(() => {
    if (
      !channel ||
      !authUser?._id
    ) {
      return undefined;
    }

    const subscription = channel.on(
      "message.new",
      async (event) => {
        if (
          event.user?.id &&
          String(event.user.id) !==
            String(authUser._id) &&
          document.visibilityState ===
            "visible"
        ) {
          try {
            await channel.markRead();
          } catch {
            // Stream retries normal
            // read synchronization.
          }
        }
      }
    );

    return () =>
      subscription?.unsubscribe?.();
  }, [
    authUser?._id,
    channel,
  ]);

  const presenceByUserId =
    useMemo(() => {
      if (
        !friend?._id ||
        !friendPresence
      ) {
        return {};
      }

      return {
        [String(friend._id)]:
          friendPresence,
      };
    }, [
      friend?._id,
      friendPresence,
    ]);

  const handleRetry = async () => {
    setInitializationError(null);

    await Promise.all([
      accessQuery.refetch(),
      tokenQuery.refetch(),
    ]);

    setRetryCount(
      (count) => count + 1
    );
  };

  const handleVideoCallClick = () => {
    if (
      !channel ||
      !friend ||
      sendingCallInvite
    ) {
      return;
    }

    setShowCallConfirm(true);
  };

  const handleCancelVideoCall = () => {
    if (sendingCallInvite) {
      return;
    }

    setShowCallConfirm(false);
  };

  const handleStartVideoCall =
    async () => {
      if (
        !channel ||
        !friend ||
        !authUser ||
        sendingCallInvite
      ) {
        return;
      }

      try {
        setSendingCallInvite(true);

        await channel.sendMessage({
          text: `${authUser.fullName} started a video call`,

          zenvioCallInvite: true,

          callCallerId:
            String(authUser._id),

          callTargetId:
            String(friend._id),
        });

        setShowCallConfirm(false);

        toast.success(
          "Video call invitation sent"
        );

        navigate(
          `/call/${friend._id}`
        );
      } catch {
        toast.error(
          "Could not start the video call."
        );
      } finally {
        setSendingCallInvite(false);
      }
    };

  const accessError =
    accessQuery.error;

  const tokenError =
    tokenQuery.error;

  const activeError =
    accessError ||
    tokenError ||
    initializationError;

  if (
    accessQuery.isPending ||
    (
      accessQuery.data?.success &&
      tokenQuery.isPending
    )
  ) {
    return (
      <ChatLoader
        message="Authorizing conversation..."
      />
    );
  }

  if (activeError) {
    const recoverable =
      isRecoverableChatError(
        activeError
      );

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
              {getChatErrorMessage(
                activeError
              )}
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
                  onClick={
                    handleRetry
                  }
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
      <ChatLoader
        message="Connecting to chat..."
      />
    );
  }

  return (
    <>
      <div className="h-[calc(100dvh-8rem)] min-h-[420px] p-2 sm:p-4 lg:h-[calc(100vh-4rem)] lg:min-h-[560px]">
        <div className="h-full max-w-[1500px] mx-auto flex overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm">

          <ChatFriendList
            friends={friends}
            activeFriendId={
              friend._id
            }
            isLoading={
              friendsQuery.isPending
            }
            isError={
              friendsQuery.isError
            }
            onRetry={() =>
              friendsQuery.refetch()
            }
            presenceByUserId={
              presenceByUserId
            }
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

                <div className="relative shrink-0">
                  <ProfileAvatar
                    src={
                      friend.profilePic
                    }
                    name={
                      friend.fullName
                    }
                    className="w-10 h-10"
                  />

                  {friendPresence?.online && (
                    <span
                      className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-base-100 bg-success"
                      aria-label={`${friend.fullName} is active now`}
                    />
                  )}
                </div>

                <div className="min-w-0">
                  <h1 className="font-semibold truncate">
                    {friend.fullName}
                  </h1>

                  <UserPresence
                    user={
                      friendPresence
                    }
                    fallbackText="Private conversation"
                  />
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
                  onClick={
                    handleVideoCallClick
                  }
                  disabled={
                    sendingCallInvite
                  }
                  className="btn btn-success btn-sm text-white"
                  aria-label={`Start video call with ${friend.fullName}`}
                >
                  {sendingCallInvite ? (
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
                <Channel
                  channel={channel}
                  DateSeparator={
                    ChatDateSeparator
                  }
                  Message={
                    VideoCallInviteMessage
                  }
                >
                  <div className="h-full w-full flex min-w-0">
                    <Window>
                      <MessageList
                        hideNewMessageSeparator
                      />

                      <MessageInput
                        focus
                      />
                    </Window>

                    <Thread />
                  </div>
                </Channel>
              </Chat>
            </div>
          </section>
        </div>
      </div>

      {showCallConfirm && (
        <div
          className="modal modal-open"
          role="dialog"
          aria-modal="true"
          aria-labelledby="start-call-title"
        >
          <div className="modal-box max-w-md">
            <div className="flex items-start gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-full bg-success/15 text-success">
                <VideoIcon className="size-5" />
              </div>

              <div className="min-w-0">
                <h2
                  id="start-call-title"
                  className="text-lg font-bold"
                >
                  Start video call?
                </h2>

                <p className="mt-2 text-sm opacity-70">
                  Start a private video call
                  with{" "}
                  <span className="font-semibold">
                    {friend.fullName}
                  </span>
                  ?
                </p>
              </div>
            </div>

            <div className="modal-action">
              <button
                type="button"
                className="btn"
                disabled={
                  sendingCallInvite
                }
                onClick={
                  handleCancelVideoCall
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn btn-success text-white"
                disabled={
                  sendingCallInvite
                }
                onClick={
                  handleStartVideoCall
                }
              >
                {sendingCallInvite ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <VideoIcon className="size-4" />
                )}

                Start Call
              </button>
            </div>
          </div>

          <button
            type="button"
            className="modal-backdrop"
            aria-label="Close video call confirmation"
            onClick={
              handleCancelVideoCall
            }
          >
            close
          </button>
        </div>
      )}
    </>
  );
};

export default ChatPage;