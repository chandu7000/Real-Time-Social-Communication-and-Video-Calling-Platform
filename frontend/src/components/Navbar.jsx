import { Link, useLocation } from "react-router-dom";
import { BellIcon, LogOutIcon, ShipWheelIcon } from "lucide-react";
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
  return <header className="sticky top-0 z-40 px-2 pt-2 sm:px-4 lg:px-5">
    <nav className="mx-auto flex h-[66px] w-full max-w-[1600px] items-center gap-2 rounded-2xl border border-base-300/70 bg-base-100/80 px-3 shadow-sm backdrop-blur-xl sm:px-4" aria-label="Primary navigation">
      <Link to="/" className={`items-center gap-2.5 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isChatPage ? "flex" : "flex lg:hidden"}`} aria-label="Zenvio home">
        <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-content shadow-md shadow-primary/20"><ShipWheelIcon className="size-5" /></span><span className="text-xl font-black tracking-[-0.04em]">Zenvio</span>
      </Link>
      <div className="ml-auto flex items-center gap-1">
        <Link to="/notifications" className="btn btn-ghost btn-circle relative hidden lg:inline-flex" aria-label="Open notifications"><BellIcon className="size-5" /><NotificationCountBadge className="absolute -right-1 -top-1" /></Link>
        <ThemeSelector />
        <Link to="/profile" className="mx-1 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label="Open my profile"><ProfileAvatar src={authUser?.profilePic} name={authUser?.fullName} className="h-9 w-9 ring-2 ring-primary/15" /></Link>
        <button type="button" className="btn btn-ghost btn-circle" onClick={logoutMutation} aria-label="Log out"><LogOutIcon className="size-5" /></button>
      </div>
    </nav>
  </header>;
};
export default Navbar;
