import { Link } from "react-router-dom";
import {
  MessageCircleIcon,
  UsersIcon,
} from "lucide-react";

import ProfileAvatar from "./ProfileAvatar";
import { useChatUnreadStore } from "../store/useChatUnreadStore";

const ChatFriendList = ({
  friends = [],
  activeFriendId,
  isLoading,
  isError,
  onRetry,
  variant = "sidebar",
  presenceByUserId = {},
}) => {
  const conversationsByUserId =
    useChatUnreadStore(
      (state) =>
        state.conversationsByUserId
    );

  const sortedFriends =
    [...friends].sort(
      (first, second) => {
        const firstConversation =
          conversationsByUserId[
            String(first._id)
          ];

        const secondConversation =
          conversationsByUserId[
            String(second._id)
          ];

        if (
          firstConversation?.hasUnread !==
          secondConversation?.hasUnread
        ) {
          return firstConversation?.hasUnread
            ? -1
            : 1;
        }

        return (
          (
            secondConversation?.lastActivity ||
            0
          ) -
          (
            firstConversation?.lastActivity ||
            0
          )
        );
      }
    );

  const containerClass =
    variant === "page"
      ? "flex w-full flex-col bg-base-200/40 lg:w-1/3 lg:min-w-72 lg:max-w-sm lg:border-r lg:border-base-300"
      : "hidden lg:flex lg:w-1/4 lg:min-w-64 lg:max-w-80 flex-col border-r border-base-300 bg-base-200/40";

  return (
    <aside
      className={containerClass}
      aria-label="Chat conversations"
    >
      <div className="border-b border-base-300 px-4 py-4">
        <div className="flex items-center gap-2">
          <UsersIcon
            className="size-5 text-primary"
            aria-hidden="true"
          />

          <div>
            <h2 className="font-bold">
              Chats
            </h2>

            <p className="text-xs opacity-60">
              Your Zenvio friends
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-md" />
          </div>
        ) : isError ? (
          <div className="p-3 text-center">
            <p className="text-sm opacity-70">
              Unable to load friends.
            </p>

            <button
              type="button"
              className="btn btn-primary btn-xs mt-3"
              onClick={onRetry}
            >
              Retry
            </button>
          </div>
        ) : sortedFriends.length ===
          0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
            <MessageCircleIcon
              className="size-8 opacity-35"
              aria-hidden="true"
            />

            <p className="mt-3 text-sm font-medium">
              No friends yet
            </p>

            <p className="mt-1 text-xs opacity-60">
              Add friends to start a
              conversation.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {sortedFriends.map(
              (friend) => {
                const friendId =
                  String(friend._id);

                const active =
                  friendId ===
                  String(
                    activeFriendId
                  );

                const conversation =
                  conversationsByUserId[
                    friendId
                  ];

                const presence =
                  presenceByUserId[
                    friendId
                  ];

                const hasUnread =
                  Boolean(
                    conversation?.hasUnread &&
                      !active
                  );

                const preview =
                  conversation?.lastMessage ||
                  "Private conversation";

                return (
                  <Link
                    key={
                      friend._id
                    }
                    to={`/chat/${friend._id}`}
                    aria-current={
                      active
                        ? "page"
                        : undefined
                    }
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 transition-colors ${
                      active
                        ? "bg-primary text-primary-content shadow-sm"
                        : hasUnread
                          ? "bg-primary/10 hover:bg-primary/15"
                          : "hover:bg-base-300"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <ProfileAvatar
                        src={
                          friend.profilePic
                        }
                        name={
                          friend.fullName
                        }
                        className="h-11 w-11"
                      />

                      {presence?.online && (
                        <span
                          className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-base-100 bg-success"
                          aria-label={`${friend.fullName} is active now`}
                        />
                      )}

                      {hasUnread && (
                        <span
                          className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-base-100 bg-error"
                          aria-label={`Unread messages from ${friend.fullName}`}
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate ${
                          hasUnread
                            ? "font-bold"
                            : "font-semibold"
                        }`}
                      >
                        {
                          friend.fullName
                        }
                      </p>

                      <p
                        className={`truncate text-xs ${
                          active
                            ? "opacity-80"
                            : hasUnread
                              ? "font-medium opacity-80"
                              : "opacity-55"
                        }`}
                      >
                        {preview}
                      </p>
                    </div>

                    {hasUnread ? (
                      <span
                        className="size-2.5 shrink-0 rounded-full bg-error"
                        aria-hidden="true"
                      />
                    ) : (
                      <MessageCircleIcon
                        className="size-4 shrink-0 opacity-60"
                        aria-hidden="true"
                      />
                    )}
                  </Link>
                );
              }
            )}
          </div>
        )}
      </div>

      <div className="border-t border-base-300 p-3">
        <Link
          to="/friends"
          className="btn btn-ghost btn-sm w-full"
        >
          View all friends
        </Link>
      </div>
    </aside>
  );
};

export default ChatFriendList;