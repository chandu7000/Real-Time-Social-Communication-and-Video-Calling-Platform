import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangleIcon, ArrowLeftIcon, RefreshCwIcon } from "lucide-react";
import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  CallControls,
  SpeakerLayout,
  StreamTheme,
  CallingState,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";

import "@stream-io/video-react-sdk/dist/css/styles.css";

import useAuthUser from "../hooks/useAuthUser";
import { getVideoCallAccess } from "../lib/api";
import {
  buildCallMembers,
  getVideoCallErrorMessage,
  isRecoverableVideoCallError,
} from "../lib/videoCall";
import PageLoader from "../components/PageLoader";
import ProfileAvatar from "../components/ProfileAvatar";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const CallPage = () => {
  const { id: targetUserId } = useParams();
  const navigate = useNavigate();
  const { authUser } = useAuthUser();
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [initializationError, setInitializationError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const cleanupRef = useRef(null);

  const accessQuery = useQuery({
    queryKey: ["videoCallAccess", targetUserId, authUser?._id],
    queryFn: () => getVideoCallAccess(targetUserId),
    enabled: Boolean(authUser && targetUserId),
    retry: false,
  });

  useEffect(() => {
    let active = true;

    const initializeCall = async () => {
      if (!authUser || !accessQuery.data?.success || !STREAM_API_KEY) return;

      setInitializationError(null);
      setClient(null);
      setCall(null);

      let videoClient;
      let callInstance;

      try {
        const user = {
          id: String(authUser._id),
          name: authUser.fullName,
          image: authUser.profilePic || undefined,
        };

        videoClient = new StreamVideoClient({
          apiKey: STREAM_API_KEY,
          user,
          token: accessQuery.data.token,
        });

        callInstance = videoClient.call("default", accessQuery.data.callId);
        await callInstance.join({
          create: true,
          data: {
            members: buildCallMembers(authUser._id, accessQuery.data.targetUser._id),
          },
        });

        if (!active) {
          await callInstance.leave().catch(() => undefined);
          await videoClient.disconnectUser().catch(() => undefined);
          return;
        }

        cleanupRef.current = async () => {
          await callInstance.leave().catch(() => undefined);
          await videoClient.disconnectUser().catch(() => undefined);
        };
        setClient(videoClient);
        setCall(callInstance);
      } catch (error) {
        if (callInstance) await callInstance.leave().catch(() => undefined);
        if (videoClient) await videoClient.disconnectUser().catch(() => undefined);
        if (active) setInitializationError(error);
      }
    };

    initializeCall();

    return () => {
      active = false;
      const cleanup = cleanupRef.current;
      cleanupRef.current = null;
      if (cleanup) void cleanup();
    };
  }, [accessQuery.data, authUser, retryCount]);

  const handleRetry = useCallback(async () => {
    setInitializationError(null);
    setClient(null);
    setCall(null);
    const result = await accessQuery.refetch();
    if (result.data?.success) setRetryCount((count) => count + 1);
  }, [accessQuery]);

  const activeError = accessQuery.error || initializationError;

  if (accessQuery.isPending || (accessQuery.data?.success && !client && !call && !activeError)) {
    return <PageLoader />;
  }

  if (!STREAM_API_KEY) {
    return (
      <CallErrorState
        message="Video calling is not configured. The Stream public API key is missing."
        recoverable={false}
        onRetry={handleRetry}
      />
    );
  }

  if (activeError) {
    return (
      <CallErrorState
        message={getVideoCallErrorMessage(activeError)}
        recoverable={isRecoverableVideoCallError(activeError)}
        onRetry={handleRetry}
      />
    );
  }

  if (!client || !call || !accessQuery.data?.targetUser) {
    return (
      <CallErrorState
        message="Could not initialize the video call."
        recoverable={true}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <div className="min-h-screen bg-base-300 flex flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-base-content/10 bg-base-100 px-3 py-2 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-circle"
            aria-label="Leave video call and go back"
            onClick={() => navigate(`/chat/${accessQuery.data.targetUser._id}`)}
          >
            <ArrowLeftIcon className="size-5" />
          </button>
          <ProfileAvatar
            src={accessQuery.data.targetUser.profilePic}
            name={accessQuery.data.targetUser.fullName}
            className="h-9 w-9"
          />
          <div className="min-w-0">
            <h1 className="truncate font-semibold">{accessQuery.data.targetUser.fullName}</h1>
            <p className="text-xs opacity-60">Private video call</p>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 p-2 sm:p-4">
        <StreamVideo client={client}>
          <StreamCall call={call}>
            <CallContent targetUserId={accessQuery.data.targetUser._id} />
          </StreamCall>
        </StreamVideo>
      </main>
    </div>
  );
};

function CallContent({ targetUserId }) {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const navigate = useNavigate();
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (callingState === CallingState.LEFT && !hasNavigated.current) {
      hasNavigated.current = true;
      navigate(`/chat/${targetUserId}`, { replace: true });
    }
  }, [callingState, navigate, targetUserId]);

  if (callingState === CallingState.JOINING) {
    return <PageLoader />;
  }

  return (
    <StreamTheme>
      <div className="h-[calc(100vh-5.5rem)] min-h-[420px] overflow-hidden rounded-xl bg-black shadow-lg">
        <div className="h-[calc(100%-5rem)] min-h-0">
          <SpeakerLayout participantsBarPosition="bottom" />
        </div>
        <div className="flex h-20 items-center justify-center px-2" aria-label="Video call controls">
          <CallControls />
        </div>
      </div>
    </StreamTheme>
  );
}

function CallErrorState({ message, recoverable, onRetry }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="card w-full max-w-lg bg-base-100 shadow-xl">
        <div className="card-body items-center text-center">
          <AlertTriangleIcon className="size-11 text-error" aria-hidden="true" />
          <h1 className="card-title">Video call unavailable</h1>
          <p className="opacity-75">{message}</p>
          <p className="text-sm opacity-60">
            If camera or microphone access was denied, allow it in your browser site settings before retrying.
          </p>
          <div className="card-actions mt-3 flex-wrap justify-center">
            <Link to="/friends" className="btn btn-outline btn-sm">
              <ArrowLeftIcon className="size-4" /> Back to Friends
            </Link>
            {recoverable && (
              <button type="button" className="btn btn-primary btn-sm" onClick={onRetry}>
                <RefreshCwIcon className="size-4" /> Retry
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CallPage;
