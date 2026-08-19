import { useQuery } from "@tanstack/react-query";
import { ChevronRightIcon } from "lucide-react";
import { Link } from "react-router-dom";
import NoFriendsFound from "../components/NoFriendsFound";
import ProfileAvatar from "../components/ProfileAvatar";
import { getUserFriends } from "../lib/api";
import { getFriendsFromResponse } from "../lib/friends";
import { getApiErrorMessage } from "../lib/profile";

const FriendsPage = () => {
  const friendsQuery = useQuery({ queryKey: ["friends"], queryFn: getUserFriends, retry: false });
  const friends = getFriendsFromResponse(friendsQuery.data);

  return (
    <div className="page-shell">
      <div className="mx-auto w-full max-w-3xl min-w-0">
        <div className="mb-5">
          <h1 className="page-heading">Friends</h1>
          <p className="page-subtitle">People you have connected with on Zenvio.</p>
        </div>

        {friendsQuery.isLoading ? (
          <div className="flex justify-center py-16"><span className="loading loading-spinner loading-lg" /></div>
        ) : friendsQuery.isError ? (
          <div className="space-y-3">
            <div className="alert alert-error"><span>{getApiErrorMessage(friendsQuery.error, "Unable to load friends")}</span></div>
            <button className="btn btn-primary btn-sm" onClick={() => friendsQuery.refetch()}>Retry</button>
          </div>
        ) : friends.length === 0 ? (
          <NoFriendsFound />
        ) : (
          <div className="surface-card overflow-hidden divide-y divide-base-300">
            {friends.map((friend) => (
              <Link
                key={friend._id}
                to={`/users/${friend._id}`}
                className="flex min-w-0 items-center gap-3 px-3 py-3 transition-colors hover:bg-base-200/70 focus-visible:bg-base-200 sm:px-4 sm:py-4"
                aria-label={`View ${friend.fullName}'s profile`}
              >
                <ProfileAvatar src={friend.profilePic} name={friend.fullName} className="h-12 w-12 shrink-0 sm:h-14 sm:w-14" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold sm:text-lg">{friend.fullName}</p>
                </div>
                <ChevronRightIcon className="size-5 shrink-0 opacity-45" aria-hidden="true" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsPage;
