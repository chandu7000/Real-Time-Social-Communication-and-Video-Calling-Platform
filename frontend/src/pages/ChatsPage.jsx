import { useQuery } from "@tanstack/react-query";
import { MessageCircleIcon } from "lucide-react";

import { getUserFriends } from "../lib/api";
import ChatFriendList from "../components/ChatFriendList";

const ChatsPage = () => {
  const friendsQuery = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
    staleTime: 30 * 1000,
  });

  const friends = Array.isArray(friendsQuery.data?.friends)
    ? friendsQuery.data.friends
    : [];

  return (
    <div className="page-shell h-[calc(100dvh-8rem)] min-h-[480px] lg:h-[calc(100vh-4rem)] lg:min-h-[560px]">
      <div className="flex h-full overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm">
        <ChatFriendList
          friends={friends}
          isLoading={friendsQuery.isPending}
          isError={friendsQuery.isError}
          onRetry={() => friendsQuery.refetch()}
          variant="page"
        />

        <section className="hidden min-w-0 flex-1 items-center justify-center bg-base-200/25 p-8 text-center lg:flex">
          <div className="max-w-sm">
            <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
              <MessageCircleIcon className="size-8" aria-hidden="true" />
            </span>
            <h1 className="mt-5 text-2xl font-bold">Your conversations</h1>
            <p className="mt-2 text-sm opacity-65">
              Choose a friend from the list to open your private Zenvio chat.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ChatsPage;
