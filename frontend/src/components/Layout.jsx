import MobileBottomNav from "./MobileBottomNav";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const Layout = ({ children, showSidebar = false }) => (
  <div className="relative min-h-screen overflow-hidden bg-base-200/55">
    <div className="pointer-events-none fixed inset-0 z-0 opacity-70" aria-hidden="true">
      <div className="absolute -left-40 -top-44 size-[30rem] rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -right-52 top-1/3 size-[34rem] rounded-full bg-secondary/5 blur-3xl" />
    </div>
    <div className="relative z-10 flex min-h-screen">
      {showSidebar && <Sidebar />}
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />
        <main id="main-content" className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto pb-24 lg:pb-0">
          {children}
        </main>
        <MobileBottomNav />
      </div>
    </div>
  </div>
);

export default Layout;
