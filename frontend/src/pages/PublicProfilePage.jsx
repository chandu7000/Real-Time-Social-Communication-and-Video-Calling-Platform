import {
  useEffect,
  useState,
} from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  MapPinIcon,
  MessageCircleIcon,
  UserMinusIcon,
  UserPlusIcon,
} from "lucide-react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import toast from "react-hot-toast";

import {
  getChatAccess,
  getPublicProfile,
  getStreamToken,
  removeFriend,
  sendFriendRequest,
} from "../lib/api";
import { relationshipAction } from "../lib/friends";
import { getApiErrorMessage } from "../lib/profile";
import {
  connectStreamUser,
  getStreamChatClient,
  subscribeToStreamUserPresence,
} from "../lib/streamChat";

import useAuthUser from "../hooks/useAuthUser";

import ProfileAvatar from "../components/ProfileAvatar";
import UserPresence from "../components/UserPresence";

const PublicProfilePage = () => {
  const { id } = useParams();

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { authUser } =
    useAuthUser();

  const [
    showRemoveConfirm,
    setShowRemoveConfirm,
  ] = useState(false);

  const [
    presenceUser,
    setPresenceUser,
  ] = useState(null);

  const profileQuery = useQuery({
    queryKey: [
      "publicProfile",
      id,
    ],
    queryFn: () =>
      getPublicProfile(id),
    enabled: Boolean(id),
    retry: false,
  });

  const user =
    profileQuery.data?.user;

  const action =
    relationshipAction(
      profileQuery.data
        ?.relationshipStatus
    );

  const isFriend =
    action === "friends";

  const presenceAccessQuery =
    useQuery({
      queryKey: [
        "chatAccess",
        id,
      ],
      queryFn: () =>
        getChatAccess(id),
      enabled: Boolean(
        authUser &&
          id &&
          isFriend
      ),
      retry: false,
    });

  const presenceTokenQuery =
    useQuery({
      queryKey: [
        "streamToken",
        authUser?._id,
      ],
      queryFn:
        getStreamToken,
      enabled: Boolean(
        authUser &&
          isFriend &&
          presenceAccessQuery
            .data?.success
      ),
      staleTime:
        5 * 60 * 1000,
      retry: 1,
    });

  useEffect(() => {
    let active = true;
    let unsubscribePresence =
      () => {};

    const initializePresence =
      async () => {
        if (
          !authUser ||
          !user?._id ||
          !isFriend ||
          !presenceAccessQuery
            .data?.channelId ||
          !presenceTokenQuery
            .data?.token
        ) {
          if (active) {
            setPresenceUser(
              null
            );
          }

          return;
        }

        try {
          const client =
            getStreamChatClient();

          await connectStreamUser(
            client,
            authUser,
            presenceTokenQuery
              .data.token
          );

          const presenceChannel =
            client.channel(
              "messaging",
              presenceAccessQuery
                .data.channelId,
              {
                members: [
                  authUser._id,
                  user._id,
                ],
              }
            );

          await presenceChannel.watch({
            presence: true,
          });

          if (!active) {
            return;
          }

          unsubscribePresence =
            subscribeToStreamUserPresence(
              presenceChannel,
              user._id,
              (streamUser) => {
                if (active) {
                  setPresenceUser(
                    streamUser
                  );
                }
              }
            );
        } catch {
          if (active) {
            setPresenceUser(
              null
            );
          }
        }
      };

    initializePresence();

    return () => {
      active = false;
      unsubscribePresence();
    };
  }, [
    authUser,
    isFriend,
    presenceAccessQuery
      .data?.channelId,
    presenceTokenQuery
      .data?.token,
    user?._id,
  ]);

  const refreshRelationships =
    () => {
      queryClient.invalidateQueries({
        queryKey: ["friends"],
      });

      queryClient.invalidateQueries({
        queryKey: ["users"],
      });

      queryClient.invalidateQueries({
        queryKey: [
          "userSearch",
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          "publicProfile",
          id,
        ],
      });
    };

  const sendMutation =
    useMutation({
      mutationFn: () =>
        sendFriendRequest(id),

      onSuccess: () => {
        toast.success(
          "Friend request sent"
        );

        refreshRelationships();

        queryClient.invalidateQueries({
          queryKey: [
            "outgoingFriendReqs",
          ],
        });
      },

      onError: (error) =>
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to send friend request"
          )
        ),
    });

  const removeMutation =
    useMutation({
      mutationFn: () =>
        removeFriend(id),

      onSuccess: async () => {
        toast.success(
          "Friend removed"
        );

        setShowRemoveConfirm(
          false
        );

        await refreshRelationships();

        navigate(
          "/friends",
          {
            replace: true,
          }
        );
      },

      onError: (error) =>
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to remove friend"
          )
        ),
    });

  if (profileQuery.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (
    profileQuery.isError ||
    !user
  ) {
    return (
      <div className="page-shell max-w-3xl">
        <Link
          to="/friends"
          className="btn btn-ghost btn-sm mb-4"
        >
          <ArrowLeftIcon className="size-4" />
          Back
        </Link>

        <div className="alert alert-error">
          <span>
            {getApiErrorMessage(
              profileQuery.error,
              "Profile not found"
            )}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="mx-auto w-full max-w-3xl min-w-0">
        <Link
          to="/friends"
          className="btn btn-ghost btn-sm mb-4"
        >
          <ArrowLeftIcon className="size-4" />
          Back to friends
        </Link>

        <div className="surface-card overflow-hidden">
          <div className="card-body min-w-0 p-4 sm:p-6">
            <div className="flex min-w-0 flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">

              <div className="relative shrink-0">
                <ProfileAvatar
                  src={
                    user.profilePic
                  }
                  name={
                    user.fullName
                  }
                  className="h-28 w-28"
                />

                {presenceUser?.online && (
                  <span
                    className="absolute bottom-1 right-1 size-4 rounded-full border-[3px] border-base-200 bg-success"
                    aria-label={`${user.fullName} is active now`}
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="break-words text-2xl font-bold sm:text-3xl">
                  {user.fullName}
                </h1>

                <p className="mt-1 flex items-center justify-center gap-1 break-words opacity-70 sm:justify-start">
                  <MapPinIcon className="size-4 shrink-0" />

                  {user.location ||
                    "Location not shared"}
                </p>

                {isFriend && (
                  <UserPresence
                    user={
                      presenceUser
                    }
                    className="mt-2 justify-center sm:justify-start"
                    fallbackText={null}
                  />
                )}

                <p className="mt-4 break-words whitespace-pre-wrap opacity-80">
                  {user.bio ||
                    "No bio added yet."}
                </p>
              </div>
            </div>

            <div className="divider" />

            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <div className="min-w-0 rounded-box bg-base-100 p-4">
                <p className="text-sm opacity-60">
                  Native language
                </p>

                <p className="mt-1 break-words font-medium">
                  {user.nativeLanguage ||
                    "Not shared"}
                </p>
              </div>

              <div className="min-w-0 rounded-box bg-base-100 p-4">
                <p className="text-sm opacity-60">
                  Learning language
                </p>

                <p className="mt-1 break-words font-medium">
                  {user.learningLanguage ||
                    "Not shared"}
                </p>
              </div>
            </div>

            <div className="mt-2 flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
              {action ===
              "request_sent" ? (
                <button
                  className="btn btn-disabled sm:w-auto"
                  disabled
                >
                  <CheckCircleIcon className="size-4" />
                  Request Sent
                </button>
              ) : action ===
                "review_request" ? (
                <Link
                  className="btn btn-secondary sm:w-auto"
                  to="/notifications"
                >
                  Review Incoming Request
                </Link>
              ) : action ===
                "friends" ? (
                <>
                  <Link
                    className="btn btn-primary sm:w-auto"
                    to={`/chat/${user._id}`}
                  >
                    <MessageCircleIcon className="size-4" />
                    Message
                  </Link>

                  <button
                    className="btn btn-outline btn-error sm:w-auto"
                    onClick={() =>
                      setShowRemoveConfirm(
                        true
                      )
                    }
                  >
                    <UserMinusIcon className="size-4" />
                    Remove Friend
                  </button>
                </>
              ) : (
                <button
                  className="btn btn-primary sm:w-auto"
                  disabled={
                    sendMutation.isPending
                  }
                  onClick={() =>
                    sendMutation.mutate()
                  }
                >
                  {sendMutation.isPending ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <UserPlusIcon className="size-4" />
                  )}

                  Add Friend
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showRemoveConfirm && (
        <div
          className="modal modal-open"
          role="dialog"
          aria-modal="true"
          aria-labelledby="remove-friend-title"
        >
          <div className="modal-box max-w-md">
            <h2
              id="remove-friend-title"
              className="font-bold text-lg"
            >
              Remove friend?
            </h2>

            <p className="py-4 break-words">
              Remove {user.fullName} from
              your friends?
            </p>

            <div className="modal-action">
              <button
                className="btn"
                disabled={
                  removeMutation.isPending
                }
                onClick={() =>
                  setShowRemoveConfirm(
                    false
                  )
                }
              >
                Cancel
              </button>

              <button
                className="btn btn-error"
                disabled={
                  removeMutation.isPending
                }
                onClick={() =>
                  removeMutation.mutate()
                }
              >
                {removeMutation.isPending && (
                  <span className="loading loading-spinner loading-xs" />
                )}

                Remove Friend
              </button>
            </div>
          </div>

          <button
            className="modal-backdrop"
            aria-label="Close remove friend dialog"
            onClick={() =>
              !removeMutation.isPending &&
              setShowRemoveConfirm(false)
            }
          >
            close
          </button>
        </div>
      )}
    </div>
  );
};

export default PublicProfilePage;