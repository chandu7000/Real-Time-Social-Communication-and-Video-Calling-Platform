import { Link, useLocation } from "react-router-dom";
import { BellIcon, HomeIcon, MessageCircleIcon, ShipWheelIcon, UserCircleIcon, UsersIcon } from "lucide-react";
import { createElement } from "react";
import useAuthUser from "../hooks/useAuthUser";
import ChatUnreadBadge from "./ChatUnreadBadge";
import NotificationCountBadge from "./NotificationCountBadge";
import ProfileAvatar from "./ProfileAvatar";

const Sidebar = () => {
  const { authUser } = useAuthUser();
  const { pathname } = useLocation();
  const navigation = [
    { to: "/", label: "Home", icon: HomeIcon },
    { to: "/profile", label: "My Profile", icon: UserCircleIcon },
    { to: "/friends", label: "Friends", icon: UsersIcon },
    { to: "/chats", label: "Chats", icon: MessageCircleIcon, chatBadge: true },
    { to: "/notifications", label: "Notifications", icon: BellIcon, notificationBadge: true },
  ];
  const isActive = (to) => to === "/chats" ? pathname === "/chats" || pathname.startsWith("/chat/") : pathname === to;

  return (
    <aside className="sticky top-0 hidden h-screen w-[278px] shrink-0 p-3 lg:block" aria-label="Sidebar navigation">
      <div className="flex h-full flex-col overflow-hidden rounded-[1.8rem] border border-base-300/70 bg-base-100/80 shadow-xl shadow-base-content/5 backdrop-blur-xl">
        <div className="px-5 pb-5 pt-6">
          <Link to="/" className="flex items-center gap-3 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label="Zenvio home">
            <span className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-content shadow-lg shadow-primary/20"><ShipWheelIcon className="size-6" aria-hidden="true" /></span>
            <div><span className="block text-[1.35rem] font-black tracking-[-0.04em]">Zenvio</span><span className="block text-[10px] font-semibold uppercase tracking-[0.24em] opacity-45">Stay connected</span></div>
          </Link>
        </div>
        <div className="mx-5 h-px bg-base-content/8" />
        <nav className="flex-1 space-y-1.5 px-3 py-5" aria-label="Desktop navigation">
          {navigation.map(({ to, label, icon, chatBadge, notificationBadge }) => {
            const active = isActive(to);
            return <Link key={to} to={to} aria-current={active ? "page" : undefined} className={`group flex min-h-12 items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${active ? "bg-primary text-primary-content shadow-lg shadow-primary/15" : "opacity-75 hover:bg-base-200 hover:opacity-100"}`}>
              <span className={`grid size-8 place-items-center rounded-xl transition-colors ${active ? "bg-primary-content/12" : "bg-base-200 group-hover:bg-base-300"}`}>{createElement(icon,{className:"size-[18px] shrink-0","aria-hidden":true})}</span>
              <span>{label}</span>{chatBadge && <ChatUnreadBadge className="ml-auto" />}{notificationBadge && <NotificationCountBadge className="ml-auto" />}
            </Link>;
          })}
        </nav>
        <div className="m-3 rounded-2xl bg-base-200/70 p-2.5">
          <Link to="/profile" className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-base-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <ProfileAvatar src={authUser?.profilePic} name={authUser?.fullName} className="h-10 w-10 shrink-0 ring-2 ring-primary/15" />
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{authUser?.fullName || "My profile"}</p><p className="mt-0.5 flex items-center gap-1.5 text-[11px] opacity-55"><span className="size-2 rounded-full bg-success" />Signed in</p></div>
          </Link>
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;
