import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const Layout = ({ children, showSidebar = false }) => (
  <div className="min-h-screen bg-base-200/45">
    <div className="flex min-h-screen">
      {showSidebar && <Sidebar />}
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />
        <main id="main-content" className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  </div>
);

export default Layout;
