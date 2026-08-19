import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import FriendCard from "../components/FriendCard";
import NoFriendsFound from "../components/NoFriendsFound";
import { getUserFriends, removeFriend } from "../lib/api";
import { getFriendsFromResponse } from "../lib/friends";
import { getApiErrorMessage } from "../lib/profile";

const FriendsPage = () => {
  const queryClient = useQueryClient();
  const [friendToRemove, setFriendToRemove] = useState(null);

  const friendsQuery = useQuery({ queryKey: ["friends"], queryFn: getUserFriends, retry: false });
  const friends = getFriendsFromResponse(friendsQuery.data);

  const removeMutation = useMutation({
    mutationFn: removeFriend,
    onSuccess: () => {
      toast.success("Friend removed");
      setFriendToRemove(null);
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["userSearch"] });
      queryClient.invalidateQueries({ queryKey: ["publicProfile"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to remove friend")),
  });

  return (
    <div className="page-shell">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Friends</h1>
          <p className="opacity-70 mt-1">People you have connected with on Zenvio.</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {friends.map((friend) => (
              <FriendCard
                key={friend._id}
                friend={friend}
                onRemove={setFriendToRemove}
                removing={removeMutation.isPending && friendToRemove?._id === friend._id}
              />
            ))}
          </div>
        )}
      </div>

      {friendToRemove && (
        <div className="modal modal-open" role="dialog" aria-modal="true" aria-labelledby="remove-friend-title">
          <div className="modal-box">
            <h2 id="remove-friend-title" className="font-bold text-lg">Remove friend?</h2>
            <p className="py-4">Remove {friendToRemove.fullName} from your friends?</p>
            <div className="modal-action">
              <button className="btn" disabled={removeMutation.isPending} onClick={() => setFriendToRemove(null)}>Cancel</button>
              <button className="btn btn-error" disabled={removeMutation.isPending} onClick={() => removeMutation.mutate(friendToRemove._id)}>
                {removeMutation.isPending && <span className="loading loading-spinner loading-xs" />}
                Remove Friend
              </button>
            </div>
          </div>
          <button className="modal-backdrop" aria-label="Close remove friend dialog" onClick={() => !removeMutation.isPending && setFriendToRemove(null)}>close</button>
        </div>
      )}
    </div>
  );
};

export default FriendsPage;
