import { createElement } from "react";
import { Link, useLocation } from "react-router-dom";
import { BellIcon, HomeIcon, MessageCircleIcon, UserCircleIcon, UsersIcon } from "lucide-react";
import ChatUnreadBadge from "./ChatUnreadBadge";
import NotificationCountBadge from "./NotificationCountBadge";
const navigation=[{to:"/",label:"Home",icon:HomeIcon},{to:"/profile",label:"My Profile",icon:UserCircleIcon},{to:"/friends",label:"Friends",icon:UsersIcon},{to:"/chats",label:"Chats",icon:MessageCircleIcon,chatBadge:true},{to:"/notifications",label:"Notifications",icon:BellIcon,notificationBadge:true}];
const activeFor=(pathname,to)=>to==="/chats"?pathname==="/chats"||pathname.startsWith("/chat/"):pathname===to;
const MobileBottomNav=()=>{const {pathname}=useLocation();return <nav className="fixed bottom-3 left-3 right-3 z-50 grid h-[62px] grid-cols-5 rounded-[1.4rem] border border-base-300/80 bg-base-100/90 px-2 shadow-2xl shadow-base-content/15 backdrop-blur-xl lg:hidden" aria-label="Mobile navigation">
{navigation.map(({to,label,icon,chatBadge,notificationBadge})=>{const active=activeFor(pathname,to);return <Link key={to} to={to} aria-label={label} aria-current={active?"page":undefined} className="relative flex items-center justify-center rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"><span className={`relative grid size-10 place-items-center rounded-xl transition-all ${active?"-translate-y-1 bg-primary text-primary-content shadow-lg shadow-primary/25":"opacity-55 hover:bg-base-200 hover:opacity-100"}`}>{createElement(icon,{className:"size-5","aria-hidden":true})}{chatBadge&&<ChatUnreadBadge className="absolute -right-2 -top-1 scale-90"/>}{notificationBadge&&<NotificationCountBadge className="absolute -right-2 -top-1 scale-90"/>}</span></Link>})}
</nav>};
export default MobileBottomNav;
