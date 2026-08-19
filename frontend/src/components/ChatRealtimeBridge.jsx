import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";

import { getStreamToken, getUserFriends } from "../lib/api";
import {
  buildConversationSnapshot,
  filterConversationSnapshot,
} from "../lib/chatUnread";
import { connectStreamUser, getStreamChatClient } from "../lib/streamChat";
import { useChatUnreadStore } from "../store/useChatUnreadStore";

const REALTIME_STATE_EVENTS = new Set([
  "message.new",
  "message.read",
  "message.deleted",
  "notification.message_new",
  "notification.mark_read",
  "notification.added_to_channel",
  "notification.removed_from_channel",
  "channel.deleted",
]);

const ChatRealtimeBridge = ({ authUser }) => {
  const location = useLocation();
  const queryClient = useQueryClient();
  const pathnameRef = useRef(location.pathname);

  const authUserId = authUser?._id;
  const authUserName = authUser?.fullName;
  const authUserProfilePic = authUser?.profilePic;

  useEffect(() => {
    pathnameRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    let active = true;
    let eventSubscription;
    let syncTimer;

    const setSnapshot = useChatUnreadStore.getState().setSnapshot;
    const reset = useChatUnreadStore.getState().reset;

    if (!authUserId) {
      reset();
      return undefined;
    }

    const streamUser = {
      _id: authUserId,
      fullName: authUserName,
      profilePic: authUserProfilePic,
    };

    const setup = async () => {
      try {
        const tokenData = await getStreamToken();
        if (!active || !tokenData?.token) return;

        const client = getStreamChatClient();
        await connectStreamUser(client, streamUser, tokenData.token);
        if (!active) return;

        const syncChannels = async () => {
          try {
            const [channels, friendData] = await Promise.all([
              client.queryChannels(
                {
                  type: "messaging",
                  members: { $in: [authUserId] },
                },
                [{ last_message_at: -1 }],
                {
                  watch: true,
                  state: true,
                  presence: false,
                  limit: 100,
                }
              ),
              queryClient.fetchQuery({
                queryKey: ["friends"],
                queryFn: getUserFriends,
                staleTime: 30 * 1000,
              }),
            ]);

            if (!active) return;

            const friendIds = Array.isArray(friendData?.friends)
              ? friendData.friends.map((friend) => friend._id)
              : [];
            const snapshot = buildConversationSnapshot(channels, authUserId);

            setSnapshot(filterConversationSnapshot(snapshot, friendIds));
          } catch {
            if (active) reset();
          }
        };

        const scheduleSync = () => {
          window.clearTimeout(syncTimer);
          syncTimer = window.setTimeout(syncChannels, 60);
        };

        await syncChannels();

        eventSubscription = client.on((event) => {
          if (!active) return;

          const sender = event.message?.user || event.user;

          if (
            ["message.new", "notification.message_new"].includes(event.type) &&
            sender?.id &&
            String(sender.id) !== String(authUserId)
          ) {
            const senderId = String(sender.id);
            const viewingSenderChat = pathnameRef.current === `/chat/${senderId}`;

            if (!viewingSenderChat) {
              const senderName = sender.name || "A friend";
              toast.success(`New message from ${senderName}`);
            }
          }

          if (REALTIME_STATE_EVENTS.has(event.type) || event.unread_channels !== undefined) {
            scheduleSync();
          }
        });
      } catch {
        if (active) reset();
      }
    };

    setup();

    return () => {
      active = false;
      window.clearTimeout(syncTimer);
      eventSubscription?.unsubscribe?.();
    };
  }, [authUserId, authUserName, authUserProfilePic, queryClient]);

  return null;
};

export default ChatRealtimeBridge;
