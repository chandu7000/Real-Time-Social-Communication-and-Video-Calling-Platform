import { Link } from "react-router-dom";
import { UserPlusIcon, UsersIcon } from "lucide-react";

const NoFriendsFound = () => (
  <div className="surface-card flex flex-col items-center p-8 text-center">
    <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
      <UsersIcon className="size-7" aria-hidden="true" />
    </span>
    <h3 className="text-lg font-semibold">No friends yet</h3>
    <p className="mt-2 max-w-md text-sm opacity-70">Discover people and send a friend request to start a conversation.</p>
    <Link to="/" className="btn btn-primary btn-sm mt-5">
      <UserPlusIcon className="size-4" aria-hidden="true" />
      Discover People
    </Link>
  </div>
);

export default NoFriendsFound;
