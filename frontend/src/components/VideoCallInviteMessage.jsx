import {
  ClockIcon,
  VideoIcon,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageSimple,
  useChatContext,
  useMessageContext,
} from "stream-chat-react";

const VideoCallInviteMessage = () => {
  const navigate = useNavigate();

  const { client } = useChatContext();
  const { message } = useMessageContext();

  const [now, setNow] = useState(
    () => Date.now()
  );

  const isCallInvite =
    Boolean(message?.zenvioCallInvite);

  const expiresAt = message?.callExpiresAt
    ? new Date(
        message.callExpiresAt
      ).getTime()
    : null;

  useEffect(() => {
    if (
      !isCallInvite ||
      !expiresAt ||
      expiresAt <= Date.now()
    ) {
      return undefined;
    }

    const interval = window.setInterval(
      () => {
        setNow(Date.now());
      },
      1000
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [
    expiresAt,
    isCallInvite,
  ]);

  if (!isCallInvite) {
    return <MessageSimple />;
  }

  const currentUserId = String(
    client?.userID || ""
  );

  const callerId = String(
    message.callCallerId ||
      message.user?.id ||
      ""
  );

  const targetId = String(
    message.callTargetId || ""
  );

  const otherUserId =
    currentUserId === callerId
      ? targetId
      : callerId;

  const isCaller =
    currentUserId === callerId;

  /*
   * Older call invitations created before
   * expiry support do not contain callExpiresAt.
   * Treat them as expired so old invitations
   * cannot be joined forever.
   */
  const isExpired =
    !expiresAt ||
    Number.isNaN(expiresAt) ||
    now >= expiresAt;

  const remainingMilliseconds =
    isExpired
      ? 0
      : Math.max(
          0,
          expiresAt - now
        );

  const remainingSeconds =
    Math.ceil(
      remainingMilliseconds / 1000
    );

  const remainingMinutes =
    Math.floor(
      remainingSeconds / 60
    );

  const remainingSecondsPart =
    remainingSeconds % 60;

  const remainingTime = `${remainingMinutes}:${String(
    remainingSecondsPart
  ).padStart(2, "0")}`;

  const handleOpenCall = () => {
    if (
      !otherUserId ||
      isExpired
    ) {
      return;
    }

    navigate(
      `/call/${otherUserId}`
    );
  };

  return (
    <div className="my-2 flex w-full px-2 sm:px-4">
      <div
        className={`w-full max-w-sm rounded-2xl border p-4 shadow-sm ${
          isExpired
            ? "border-base-300 bg-base-200/60"
            : "border-success/25 bg-success/5"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`grid size-11 shrink-0 place-items-center rounded-full ${
              isExpired
                ? "bg-base-300 text-base-content/50"
                : "bg-success/15 text-success"
            }`}
          >
            {isExpired ? (
              <ClockIcon
                className="size-5"
                aria-hidden="true"
              />
            ) : (
              <VideoIcon
                className="size-5"
                aria-hidden="true"
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              {isExpired
                ? "Video call invitation expired"
                : "Video call invitation"}
            </p>

            <p className="mt-1 text-sm opacity-70">
              {isExpired
                ? "This call invitation is no longer available."
                : isCaller
                  ? "You started a private video call."
                  : `${
                      message.user?.name ||
                      "Your friend"
                    } started a private video call.`}
            </p>

            {!isExpired && (
              <p className="mt-2 flex items-center gap-1.5 text-xs opacity-60">
                <ClockIcon
                  className="size-3.5"
                  aria-hidden="true"
                />

                Expires in {remainingTime}
              </p>
            )}
          </div>
        </div>

        {isExpired ? (
          <button
            type="button"
            className="btn btn-disabled btn-sm mt-4 w-full"
            disabled
          >
            <ClockIcon className="size-4" />
            Call Expired
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-success btn-sm mt-4 w-full text-white"
            disabled={!otherUserId}
            onClick={handleOpenCall}
          >
            <VideoIcon className="size-4" />

            {isCaller
              ? "Return to Call"
              : "Join Call"}
          </button>
        )}
      </div>
    </div>
  );
};

export default VideoCallInviteMessage;