import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftIcon, CheckCircleIcon, MapPinIcon, MessageCircleIcon, UserPlusIcon } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getPublicProfile, sendFriendRequest } from "../lib/api";
import { relationshipAction } from "../lib/friends";
import { getApiErrorMessage } from "../lib/profile";
import ProfileAvatar from "../components/ProfileAvatar";

const PublicProfilePage = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: ["publicProfile", id],
    queryFn: () => getPublicProfile(id),
    enabled: Boolean(id),
    retry: false,
  });

  const sendMutation = useMutation({
    mutationFn: () => sendFriendRequest(id),
    onSuccess: () => {
      toast.success("Friend request sent");
      queryClient.invalidateQueries({ queryKey: ["publicProfile", id] });
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["userSearch"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to send friend request")),
  });

  const user = profileQuery.data?.user;
  const action = relationshipAction(profileQuery.data?.relationshipStatus);

  if (profileQuery.isLoading) {
    return <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg" /></div>;
  }

  if (profileQuery.isError || !user) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Link to="/" className="btn btn-ghost btn-sm mb-4"><ArrowLeftIcon className="size-4" />Back</Link>
        <div className="alert alert-error"><span>{getApiErrorMessage(profileQuery.error, "Profile not found")}</span></div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="btn btn-ghost btn-sm mb-4"><ArrowLeftIcon className="size-4" />Back to discovery</Link>

        <div className="surface-card">
          <div className="card-body">
            <div className="flex flex-col sm:flex-row gap-5">
              <ProfileAvatar src={user.profilePic} name={user.fullName} className="w-28 h-28" />
              <div className="min-w-0 flex-1">
                <h1 className="text-3xl font-bold break-words">{user.fullName}</h1>
                <p className="flex items-center gap-1 opacity-70 mt-1"><MapPinIcon className="size-4" />{user.location || "Location not shared"}</p>
                <p className="mt-4 whitespace-pre-wrap opacity-80">{user.bio || "No bio added yet."}</p>
              </div>
            </div>

            <div className="divider" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-box bg-base-100 p-4"><p className="text-sm opacity-60">Native language</p><p className="font-medium mt-1">{user.nativeLanguage || "Not shared"}</p></div>
              <div className="rounded-box bg-base-100 p-4"><p className="text-sm opacity-60">Learning language</p><p className="font-medium mt-1">{user.learningLanguage || "Not shared"}</p></div>
            </div>

            <div className="card-actions mt-2">
              {action === "request_sent" ? (
                <button className="btn btn-disabled" disabled><CheckCircleIcon className="size-4" />Request Sent</button>
              ) : action === "review_request" ? (
                <Link className="btn btn-secondary" to="/notifications">Review Incoming Request</Link>
              ) : action === "friends" ? (
                <Link className="btn btn-primary" to={`/chat/${user._id}`}><MessageCircleIcon className="size-4" />Message</Link>
              ) : (
                <button className="btn btn-primary" disabled={sendMutation.isPending} onClick={() => sendMutation.mutate()}>
                  {sendMutation.isPending ? <span className="loading loading-spinner loading-xs" /> : <UserPlusIcon className="size-4" />}
                  Add Friend
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfilePage;
