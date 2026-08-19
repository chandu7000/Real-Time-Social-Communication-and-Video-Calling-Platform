import { Link } from "react-router-dom";
import { MessageCircleIcon, UsersIcon } from "lucide-react";

import ProfileAvatar from "./ProfileAvatar";

const ChatFriendList = ({
  friends = [],
  activeFriendId,
  isLoading,
  isError,
  onRetry,
}) => {
  return (
    <aside className="hidden lg:flex lg:w-1/4 lg:min-w-64 lg:max-w-80 flex-col border-r border-base-300 bg-base-200/40">
      <div className="border-b border-base-300 px-4 py-4">
        <div className="flex items-center gap-2">
          <UsersIcon className="size-5 text-primary" aria-hidden="true" />

          <div>
            <h2 className="font-bold">Messages</h2>
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
        ) : friends.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
            <MessageCircleIcon
              className="size-8 opacity-35"
              aria-hidden="true"
            />

            <p className="mt-3 text-sm font-medium">
              No friends yet
            </p>

            <p className="mt-1 text-xs opacity-60">
              Add friends to start a conversation.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {friends.map((friend) => {
              const active =
                String(friend._id) === String(activeFriendId);

              return (
                <Link
                  key={friend._id}
                  to={`/chat/${friend._id}`}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 transition-colors ${
                    active
                      ? "bg-primary text-primary-content shadow-sm"
                      : "hover:bg-base-300"
                  }`}
                >
                  <ProfileAvatar
                    src={friend.profilePic}
                    name={friend.fullName}
                    className="h-11 w-11 shrink-0"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {friend.fullName}
                    </p>

                    <p
                      className={`truncate text-xs ${
                        active
                          ? "opacity-80"
                          : "opacity-55"
                      }`}
                    >
                      Private conversation
                    </p>
                  </div>

                  <MessageCircleIcon
                    className="size-4 shrink-0 opacity-70"
                    aria-hidden="true"
                  />
                </Link>
              );
            })}
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