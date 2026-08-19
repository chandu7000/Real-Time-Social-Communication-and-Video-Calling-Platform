import { createElement } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BellIcon,
  HomeIcon,
  MessageCircleIcon,
  UserCircleIcon,
  UsersIcon,
} from "lucide-react";

import ChatUnreadBadge from "./ChatUnreadBadge";
import NotificationCountBadge from "./NotificationCountBadge";

const navigation = [
  { to: "/", label: "Home", icon: HomeIcon },
  { to: "/profile", label: "My Profile", icon: UserCircleIcon },
  { to: "/friends", label: "Friends", icon: UsersIcon },
  { to: "/chats", label: "Chats", icon: MessageCircleIcon, chatBadge: true },
  { to: "/notifications", label: "Notifications", icon: BellIcon, notificationBadge: true },
];

const isActiveDestination = (pathname, to) => {
  if (to === "/chats") {
    return pathname === "/chats" || pathname.startsWith("/chat/");
  }

  return pathname === to;
};

const MobileBottomNav = () => {
  const { pathname } = useLocation();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 grid h-16 grid-cols-5 border-t border-base-300 bg-base-100/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_24px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden"
      aria-label="Mobile navigation"
    >
      {navigation.map(({ to, label, icon, chatBadge, notificationBadge }) => {
        const active = isActiveDestination(pathname, to);

        return (
          <Link
            key={to}
            to={to}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={`relative flex items-center justify-center rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              active ? "text-primary" : "opacity-65 hover:opacity-100"
            }`}
          >
            <span className="relative grid size-10 place-items-center">
              {createElement(icon, {
                className: "size-5",
                "aria-hidden": true,
              })}

              {chatBadge && (
                <ChatUnreadBadge className="absolute -right-2 -top-1 scale-90" />
              )}

              {notificationBadge && (
                <NotificationCountBadge className="absolute -right-2 -top-1 scale-90" />
              )}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;
