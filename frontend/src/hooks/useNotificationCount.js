import { useQuery } from "@tanstack/react-query";
import { getUnreadNotificationCount } from "../lib/api";
import { getUnreadCountFromResponse } from "../lib/notifications";

export default function useNotificationCount() {
  const query = useQuery({
    queryKey: ["notificationUnreadCount"],
    queryFn: getUnreadNotificationCount,
    retry: false,
    refetchOnWindowFocus: true,
  });

  return {
    ...query,
    unreadCount: getUnreadCountFromResponse(query.data),
  };
}
