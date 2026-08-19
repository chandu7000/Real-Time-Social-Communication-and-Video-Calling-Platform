import { Link, useLocation } from "react-router-dom";
import {
  BellIcon,
  LogOutIcon,
  ShipWheelIcon,
} from "lucide-react";

import useAuthUser from "../hooks/useAuthUser";
import useLogout from "../hooks/useLogout";
import NotificationCountBadge from "./NotificationCountBadge";
import ProfileAvatar from "./ProfileAvatar";
import ThemeSelector from "./ThemeSelector";

const Navbar = () => {
  const { authUser } = useAuthUser();
  const { logoutMutation } = useLogout();
  const location = useLocation();
  const isChatPage = location.pathname?.startsWith("/chat/");

  return (
    <header className="sticky top-0 z-40 border-b border-base-300/80 bg-base-100/95 backdrop-blur supports-[backdrop-filter]:bg-base-100/85">
      <nav
        className="mx-auto flex h-16 w-full max-w-[1600px] items-center gap-2 px-3 sm:px-5 lg:px-6"
        aria-label="Primary navigation"
      >
        <Link
          to="/"
          className={`items-center gap-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            isChatPage ? "flex" : "flex lg:hidden"
          }`}
          aria-label="Zenvio home"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
            <ShipWheelIcon className="size-5" aria-hidden="true" />
          </span>
          <span className="text-xl font-bold tracking-tight">Zenvio</span>
        </Link>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link
            to="/notifications"
            className="btn btn-ghost btn-circle relative hidden lg:inline-flex"
            aria-label="Open notifications"
          >
            <BellIcon className="size-5" aria-hidden="true" />
            <NotificationCountBadge className="absolute -right-1 -top-1" />
          </Link>

          <ThemeSelector />

          <Link
            to="/profile"
            className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100"
            aria-label="Open my profile"
          >
            <ProfileAvatar
              src={authUser?.profilePic}
              name={authUser?.fullName}
              className="h-9 w-9"
            />
          </Link>

          <button
            type="button"
            className="btn btn-ghost btn-circle"
            onClick={logoutMutation}
            aria-label="Log out"
          >
            <LogOutIcon className="size-5" aria-hidden="true" />
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
