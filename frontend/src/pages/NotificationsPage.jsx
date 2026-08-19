import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  getFriendRequests,
  getNotifications,
  getOutgoingFriendReqs,
  markAllNotificationsRead,
  markNotificationRead,
  rejectFriendRequest,
} from "../lib/api";
import {
  BellIcon,
  CheckCheckIcon,
  CheckIcon,
  ClockIcon,
  UserCheckIcon,
  UserXIcon,
  XIcon,
} from "lucide-react";
import NoNotificationsFound from "../components/NoNotificationsFound";
import ProfileAvatar from "../components/ProfileAvatar";
import { getOutgoingRequestsFromResponse } from "../lib/friends";
import { getApiErrorMessage } from "../lib/profile";
import {
  formatNotificationTime,
  getNotificationDestination,
  getNotificationsFromResponse,
} from "../lib/notifications";

const NotificationsPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const notificationsQuery = useQuery({
    queryKey: ["notifications", page],
    queryFn: () => getNotifications({ page, limit: 20 }),
    retry: false,
  });
  const friendRequestsQuery = useQuery({ queryKey: ["friendRequests"], queryFn: getFriendRequests, retry: false });
  const outgoingQuery = useQuery({ queryKey: ["outgoingFriendReqs"], queryFn: getOutgoingFriendReqs, retry: false });

  const refreshNotificationQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["notificationUnreadCount"] });
  };

  const refreshRelationshipQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] });
    queryClient.invalidateQueries({ queryKey: ["friends"] });
    queryClient.invalidateQueries({ queryKey: ["users"] });
    queryClient.invalidateQueries({ queryKey: ["userSearch"] });
    queryClient.invalidateQueries({ queryKey: ["publicProfile"] });
    refreshNotificationQueries();
  };

  const acceptMutation = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => { toast.success("Friend request accepted"); refreshRelationshipQueries(); },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to accept friend request")),
  });
  const rejectMutation = useMutation({
    mutationFn: rejectFriendRequest,
    onSuccess: () => { toast.success("Friend request rejected"); refreshRelationshipQueries(); },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to reject friend request")),
  });
  const cancelMutation = useMutation({
    mutationFn: cancelFriendRequest,
    onSuccess: () => { toast.success("Friend request cancelled"); refreshRelationshipQueries(); },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to cancel friend request")),
  });
  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: refreshNotificationQueries,
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to update notification")),
  });
  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => { toast.success("All notifications marked as read"); refreshNotificationQueries(); },
    onError: (error) => toast.error(getApiErrorMessage(error, "Unable to mark notifications as read")),
  });

  const incomingRequests = friendRequestsQuery.data?.incomingReqs || [];
  const outgoingRequests = getOutgoingRequestsFromResponse(outgoingQuery.data);
  const notifications = getNotificationsFromResponse(notificationsQuery.data);
  const pagination = notificationsQuery.data?.pagination;
  const unreadOnPage = notifications.filter((notification) => !notification.isRead).length;
  const requestsLoading = friendRequestsQuery.isLoading || outgoingQuery.isLoading;
  const requestsError = friendRequestsQuery.error || outgoingQuery.error;
  const mutationPending = acceptMutation.isPending || rejectMutation.isPending || cancelMutation.isPending;

  return (
    <div className="page-shell">
      <div className="container mx-auto max-w-4xl space-y-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="opacity-70 mt-1">Keep track of social updates and manage friend requests.</p>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm self-start"
            disabled={markAllMutation.isPending || unreadOnPage === 0}
            onClick={() => markAllMutation.mutate()}
          >
            <CheckCheckIcon className="size-4" />
            Mark all as read
          </button>
        </header>

        <section className="space-y-4" aria-labelledby="notification-updates-heading">
          <div className="flex items-center justify-between gap-3">
            <h2 id="notification-updates-heading" className="text-xl font-semibold flex items-center gap-2">
              <BellIcon className="size-5 text-primary" /> Updates
            </h2>
            {pagination?.total > 0 && <span className="text-sm opacity-60">{pagination.total} total</span>}
          </div>

          {notificationsQuery.isLoading ? (
            <div className="flex justify-center py-10" role="status" aria-label="Loading notifications">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : notificationsQuery.error ? (
            <div className="space-y-3">
              <div className="alert alert-error" role="alert">
                <span>{getApiErrorMessage(notificationsQuery.error, "Unable to load notifications")}</span>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => notificationsQuery.refetch()}>Retry</button>
            </div>
          ) : notifications.length === 0 ? (
            <NoNotificationsFound />
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => {
                const actorName = notification.actor?.fullName || "Unknown user";
                const destination = getNotificationDestination(notification);
                return (
                  <article
                    key={notification._id}
                    className={`card border shadow-sm ${notification.isRead ? "bg-base-200 border-base-300" : "bg-primary/5 border-primary/30"}`}
                  >
                    <div className="card-body p-4">
                      <div className="flex items-start gap-3">
                        <ProfileAvatar src={notification.actor?.profilePic} name={actorName} className="w-11 h-11 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              to={destination}
                              className="font-semibold hover:underline"
                              onClick={() => {
                                if (!notification.isRead && !markReadMutation.isPending) markReadMutation.mutate(notification._id);
                              }}
                            >
                              {actorName}
                            </Link>
                            {!notification.isRead && <span className="badge badge-primary badge-sm">Unread</span>}
                          </div>
                          <p className="text-sm mt-1 break-words">{notification.message || "You have a new notification"}</p>
                          <p className="text-xs opacity-60 mt-2">{formatNotificationTime(notification.createdAt)}</p>
                        </div>
                        {!notification.isRead && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            aria-label={`Mark notification from ${actorName} as read`}
                            disabled={markReadMutation.isPending}
                            onClick={() => markReadMutation.mutate(notification._id)}
                          >
                            <CheckIcon className="size-4" />
                            <span className="hidden sm:inline">Mark read</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                className="btn btn-outline btn-sm"
                disabled={!pagination.hasPreviousPage || notificationsQuery.isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </button>
              <span className="text-sm opacity-70">Page {pagination.page} of {pagination.totalPages}</span>
              <button
                className="btn btn-outline btn-sm"
                disabled={!pagination.hasNextPage || notificationsQuery.isFetching}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </button>
            </div>
          )}
        </section>

        <section className="space-y-5" aria-labelledby="friend-requests-heading">
          <div>
            <h2 id="friend-requests-heading" className="text-xl font-semibold">Friend Requests</h2>
            <p className="text-sm opacity-70 mt-1">Review incoming requests and manage requests you have sent.</p>
          </div>

          {requestsLoading ? (
            <div className="flex justify-center py-10" role="status" aria-label="Loading friend requests">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : requestsError ? (
            <div className="space-y-3">
              <div className="alert alert-error" role="alert"><span>{getApiErrorMessage(requestsError, "Unable to load friend requests")}</span></div>
              <button className="btn btn-primary btn-sm" onClick={() => { friendRequestsQuery.refetch(); outgoingQuery.refetch(); }}>Retry</button>
            </div>
          ) : (
            <div className="space-y-8">
              {incomingRequests.length > 0 && (
                <section className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <UserCheckIcon className="h-5 w-5 text-primary" /> Incoming Requests
                    <span className="badge badge-primary ml-1">{incomingRequests.length}</span>
                  </h3>
                  <div className="space-y-3">
                    {incomingRequests.map((request) => (
                      <article key={request._id} className="surface-card">
                        <div className="card-body p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <ProfileAvatar src={request.sender?.profilePic} name={request.sender?.fullName} className="w-14 h-14" />
                              <div className="min-w-0">
                                <Link to={`/users/${request.sender?._id}`} className="font-semibold hover:underline truncate block">{request.sender?.fullName || "Unknown user"}</Link>
                                <p className="text-sm opacity-70 line-clamp-1">{request.sender?.bio || "Wants to connect with you."}</p>
                              </div>
                            </div>
                            <div className="flex gap-2 sm:flex-none sm:min-w-48">
                              <button className="btn btn-primary btn-sm flex-1" disabled={mutationPending} onClick={() => acceptMutation.mutate(request._id)}>Accept</button>
                              <button
                                className="btn btn-outline btn-sm flex-1 gap-2"
                                disabled={mutationPending}
                                onClick={() => rejectMutation.mutate(request._id)}
                              >
                                <UserXIcon className="size-4 shrink-0" aria-hidden="true" />
                                <span>Reject</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {outgoingRequests.length > 0 && (
                <section className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2"><ClockIcon className="h-5 w-5 text-warning" />Sent Requests<span className="badge badge-outline ml-1">{outgoingRequests.length}</span></h3>
                  <div className="space-y-3">
                    {outgoingRequests.map((request) => (
                      <article key={request._id} className="surface-card">
                        <div className="card-body p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <ProfileAvatar src={request.recipient?.profilePic} name={request.recipient?.fullName} className="w-12 h-12" />
                            <div className="min-w-0">
                              <Link to={`/users/${request.recipient?._id}`} className="font-semibold hover:underline truncate block">{request.recipient?.fullName || "Unknown user"}</Link>
                              <p className="text-sm opacity-60">Request pending</p>
                            </div>
                          </div>
                          <button className="btn btn-outline btn-sm" disabled={mutationPending} onClick={() => cancelMutation.mutate(request._id)}><XIcon className="size-4" />Cancel Request</button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {incomingRequests.length === 0 && outgoingRequests.length === 0 && (
                <div className="rounded-xl border border-base-300 bg-base-200 p-5 text-sm opacity-70">No pending friend requests.</div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default NotificationsPage;
