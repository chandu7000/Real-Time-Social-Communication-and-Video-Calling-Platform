import { Link, useLocation } from "react-router-dom";
import { BellIcon, HomeIcon, ShipWheelIcon, UserCircleIcon, UsersIcon } from "lucide-react";
import { createElement } from "react";
import useAuthUser from "../hooks/useAuthUser";
import NotificationCountBadge from "./NotificationCountBadge";
import ProfileAvatar from "./ProfileAvatar";

const Sidebar = () => {
  const { authUser } = useAuthUser();
  const { pathname } = useLocation();

  const navigation = [
    { to: "/", label: "Home", icon: HomeIcon },
    { to: "/profile", label: "My Profile", icon: UserCircleIcon },
    { to: "/friends", label: "Friends", icon: UsersIcon },
    { to: "/notifications", label: "Notifications", icon: BellIcon, badge: true },
  ];

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-base-300 bg-base-100 lg:flex" aria-label="Sidebar navigation">
      <div className="border-b border-base-300 px-5 py-4">
        <Link to="/" className="flex items-center gap-3 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label="Zenvio home">
          <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <ShipWheelIcon className="size-6" aria-hidden="true" />
          </span>
          <div>
            <span className="block text-xl font-bold tracking-tight">Zenvio</span>
            <span className="block text-[11px] uppercase tracking-[0.16em] opacity-55">Stay connected</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4" aria-label="Desktop navigation">
        {navigation.map(({ to, label, badge, icon }) => {
          const active = pathname === to;

          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${active
                  ? "bg-primary text-primary-content shadow-sm"
                  : "hover:bg-base-200"
                }`}
            >
              {createElement(icon, {
                className: "size-5 shrink-0",
                "aria-hidden": true,
              })}
              <span>{label}</span>
              {badge && <NotificationCountBadge className="ml-auto" />}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-base-300 p-4">
        <Link to="/profile" className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-base-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <ProfileAvatar src={authUser?.profilePic} name={authUser?.fullName} className="h-10 w-10 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{authUser?.fullName || "My profile"}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs opacity-60">
              <span className="size-2 rounded-full bg-success" aria-hidden="true" />
              Signed in
            </p>
          </div>
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
