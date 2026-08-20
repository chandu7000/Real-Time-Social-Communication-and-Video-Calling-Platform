import { VideoIcon } from "lucide-react";
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

  if (!message?.zenvioCallInvite) {
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

  const handleOpenCall = () => {
    if (!otherUserId) {
      return;
    }

    navigate(`/call/${otherUserId}`);
  };

  return (
    <div className="my-2 flex w-full px-2 sm:px-4">
      <div className="w-full max-w-sm rounded-2xl border border-success/25 bg-success/5 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-full bg-success/15 text-success">
            <VideoIcon
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              Video call invitation
            </p>

            <p className="mt-1 text-sm opacity-70">
              {isCaller
                ? "You started a private video call."
                : `${
                    message.user?.name ||
                    "Your friend"
                  } started a private video call.`}
            </p>
          </div>
        </div>

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
      </div>
    </div>
  );
};

export default VideoCallInviteMessage;