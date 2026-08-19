import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircleIcon, MapPinIcon, SearchIcon, UserPlusIcon, UsersIcon, XIcon } from "lucide-react";
import toast from "react-hot-toast";
import {
  getOutgoingFriendReqs,
  getRecommendedUsers,
  getUserFriends,
  searchUsers,
  sendFriendRequest,
} from "../lib/api";
import { getApiErrorMessage } from "../lib/profile";
import { getFriendsFromResponse, getOutgoingRequestsFromResponse, relationshipAction } from "../lib/friends";
import { capitalize } from "../lib/utils";
import FriendCard, { getLanguageFlag } from "../components/FriendCard";
import NoFriendsFound from "../components/NoFriendsFound";
import ProfileAvatar from "../components/ProfileAvatar";

const PAGE_SIZE = 9;

const HomePage = () => {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: friendsData, isLoading: loadingFriends } = useQuery({ queryKey: ["friends"], queryFn: getUserFriends });
  const friends = getFriendsFromResponse(friendsData);
  const recommendationsQuery = useQuery({
    queryKey: ["users", page],
    queryFn: () => getRecommendedUsers({ page, limit: PAGE_SIZE }),
    enabled: !activeSearch,
  });
  const searchQuery = useQuery({
    queryKey: ["userSearch", activeSearch, page],
    queryFn: () => searchUsers({ query: activeSearch, page, limit: PAGE_SIZE }),
    enabled: Boolean(activeSearch),
    retry: false,
  });
  const { data: outgoingData } = useQuery({ queryKey: ["outgoingFriendReqs"], queryFn: getOutgoingFriendReqs });
  const outgoingRequestsIds = useMemo(
    () =>
      new Set(
        getOutgoingRequestsFromResponse(outgoingData)
          .map((req) => req.recipient?._id)
          .filter(Boolean)
      ),
    [outgoingData]
  );

  const { mutate: sendRequestMutation, isPending } = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["userSearch"] });
      toast.success("Friend request sent");
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to send friend request")),
  });

  const activeQuery = activeSearch ? searchQuery : recommendationsQuery;
  const users = activeQuery.data?.users || [];
  const pagination = activeQuery.data?.pagination;
  const loadingUsers = activeQuery.isLoading || activeQuery.isFetching;
  const discoveryError = activeQuery.isError ? getApiErrorMessage(activeQuery.error, "Unable to load people") : "";

  const heading = useMemo(() => activeSearch ? `Search results for “${activeSearch}”` : "Discover People", [activeSearch]);

  const submitSearch = (event) => {
    event.preventDefault();
    const query = searchInput.trim();
    if (!query) {
      setActiveSearch("");
      setPage(1);
      return;
    }
    setActiveSearch(query);
    setPage(1);
  };

  const clearSearch = () => {
    setSearchInput("");
    setActiveSearch("");
    setPage(1);
  };

  return (
    <div className="page-shell">
      <div className="container mx-auto space-y-10">
        <section>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Your Friends</h2>
            <Link to="/notifications" className="btn btn-outline btn-sm"><UsersIcon className="mr-2 size-4" />Friend Requests</Link>
          </div>
          {loadingFriends ? <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg" /></div> : friends.length === 0 ? <NoFriendsFound /> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{friends.map((friend) => <FriendCard key={friend._id} friend={friend} />)}</div>}
        </section>

        <section>
          <div className="mb-6 space-y-4">
            <div><h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{heading}</h2><p className="opacity-70 mt-1">Find people, view public profiles, and connect using your existing friend-request flow.</p></div>
            <form onSubmit={submitSearch} className="flex flex-col sm:flex-row gap-2 max-w-2xl" role="search">
              <label className="input input-bordered flex items-center gap-2 flex-1"><SearchIcon className="size-4 opacity-60" /><input className="grow min-w-0" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search users by name" aria-label="Search users by name" /></label>
              <div className="flex gap-2"><button className="btn btn-primary flex-1 sm:flex-none" type="submit">Search</button>{(activeSearch || searchInput) && <button className="btn btn-ghost" type="button" onClick={clearSearch}><XIcon className="size-4" />Clear</button>}</div>
            </form>
          </div>

          {loadingUsers ? (
            <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg" /></div>
          ) : discoveryError ? (
            <div className="space-y-3"><div className="alert alert-error"><span>{discoveryError}</span></div><button className="btn btn-primary btn-sm" onClick={() => activeQuery.refetch()}>Retry</button></div>
          ) : users.length === 0 ? (
            <div className="card bg-base-200 p-6 text-center"><h3 className="font-semibold text-lg mb-2">{activeSearch ? "No users found" : "No recommendations available"}</h3><p className="opacity-70">{activeSearch ? "Try another name or clear the search." : "There are no new people to recommend right now."}</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map((user) => {
                const hasRequestBeenSent = outgoingRequestsIds.has(user._id);
                const action = relationshipAction(user.relationshipStatus || (hasRequestBeenSent ? "outgoing_pending" : "none"));
                return (
                  <article key={user._id} className="surface-card interactive-card">
                    <div className="card-body p-5 space-y-4">
                      <div className="flex items-center gap-3"><ProfileAvatar src={user.profilePic} name={user.fullName} className="w-16 h-16" /><div className="min-w-0"><h3 className="font-semibold text-lg truncate">{user.fullName}</h3>{user.location && <div className="flex items-center text-xs opacity-70 mt-1"><MapPinIcon className="size-3 mr-1" />{user.location}</div>}</div></div>
                      <div className="flex flex-wrap gap-1.5">{user.nativeLanguage && <span className="badge badge-secondary">{getLanguageFlag(user.nativeLanguage)} Native: {capitalize(user.nativeLanguage)}</span>}{user.learningLanguage && <span className="badge badge-outline">{getLanguageFlag(user.learningLanguage)} Learning: {capitalize(user.learningLanguage)}</span>}</div>
                      <p className="text-sm opacity-70 min-h-10 line-clamp-2">{user.bio || "No bio added yet."}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Link className="btn btn-outline" to={`/users/${user._id}`}>View Profile</Link>
                        {action === "review_request" ? (
                          <Link className="btn btn-secondary" to="/notifications">Review Request</Link>
                        ) : action === "friends" ? (
                          <Link className="btn btn-primary" to={`/chat/${user._id}`}>Message</Link>
                        ) : (
                          <button className={`btn ${action === "request_sent" ? "btn-disabled" : "btn-primary"}`} onClick={() => sendRequestMutation(user._id)} disabled={action === "request_sent" || isPending}>{action === "request_sent" ? <><CheckCircleIcon className="size-4" />Request Sent</> : <><UserPlusIcon className="size-4" />Add Friend</>}</button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {pagination && pagination.totalPages > 1 && !discoveryError && (
            <div className="flex items-center justify-center gap-3 mt-8"><button className="btn btn-outline btn-sm" disabled={!pagination.hasPreviousPage || loadingUsers} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button><span className="text-sm opacity-70">Page {pagination.page} of {pagination.totalPages}</span><button className="btn btn-outline btn-sm" disabled={!pagination.hasNextPage || loadingUsers} onClick={() => setPage((value) => value + 1)}>Next</button></div>
          )}
        </section>
      </div>
    </div>
  );
};

export default HomePage;
