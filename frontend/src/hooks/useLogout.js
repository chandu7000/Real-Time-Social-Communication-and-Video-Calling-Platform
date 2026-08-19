import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "../lib/api";
import { disconnectStreamUser } from "../lib/streamChat";

const useLogout = () => {
  const queryClient = useQueryClient();

  const {
    mutate: logoutMutation,
    isPending,
    error,
  } = useMutation({
    mutationFn: async () => {
      try {
        await disconnectStreamUser();
      } catch {
        // Logout should still continue even if Stream disconnect fails.
      }

      return logout();
    },
    onSettled: () => {
      queryClient.removeQueries({ queryKey: ["streamToken"] });
      queryClient.removeQueries({ queryKey: ["chatAccess"] });
      queryClient.removeQueries({ queryKey: ["notifications"] });
      queryClient.removeQueries({ queryKey: ["notificationUnreadCount"] });
      queryClient.removeQueries({ queryKey: ["friendRequests"] });
      queryClient.removeQueries({ queryKey: ["outgoingFriendReqs"] });
      queryClient.setQueryData(["authUser"], null);
    },
  });

  return { logoutMutation, isPending, error };
};

export default useLogout;