import React, { useEffect, useState } from "react";
import {
  Search,
  Menu,
  X,
  LogOut,
  LayoutPanelLeft,
  NotebookText,
  ClipboardClock,
} from "lucide-react";
import { signOut } from "@/functions/auth/signOut";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/applicationStore";
import { useJournalStore } from "@/store/journalStore";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { fetchApplications, subscribeApplications } = useAppStore();

  const { fetchEntries, subscribeEntries } = useJournalStore();

  useEffect(() => {
    if (user?.id) {
      fetchApplications(user.id);
      fetchEntries(user.id);
      const unsubscribeApplications = subscribeApplications(user.id);
      const unsubscribeEntries = subscribeEntries(user.id);
      return () => {
        unsubscribeApplications();
        unsubscribeEntries();
      };
    }
  }, [
    user?.id,
    fetchApplications,
    subscribeApplications,
    fetchEntries,
    subscribeEntries,
  ]);

  const sidebar = [
    {
      key: 0,
      title: "Dashboard",
      path: "/dashboard",
      icon: <LayoutPanelLeft className="w-4 h-4" />,
    },
    {
      key: 1,
      title: "Application List",
      path: "/applications",
      icon: <NotebookText className="w-4 h-4" />,
    },
    {
      key: 2,
      title: "Logs",
      path: "/logs",
      icon: <ClipboardClock className="w-4 h-4" />,
    },
    // {
    //   key: 3,
    //   title: "Bell",
    //   path: "/dashboard",
    //   icon: <Bell className="w-4 h-4" />,
    // },
    // {
    //   key: 4,
    //   title: "Settings",
    //   path: "/dashboard",
    //   icon: <Settings className="w-4 h-4" />,
    // },
  ];

  const handleLogout = async () => {
    console.log("Logging out...");
    try {
      await signOut();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-neutral-50">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-neutral-900 text-white rounded-lg shadow-lg"
      >
        {isMobileSidebarOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed and Full Height */}
      <aside
        className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${
          isMobileSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }
      `}
      >
        {/* Logo */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-neutral-900 font-bold text-sm">T</span>
            </div>
            <div>
              <h1 className="font-semibold text-sm text-white">Tracktern</h1>
              <p className="text-xs text-neutral-400">
                {user?.user_metadata.full_name}
              </p>
            </div>
          </div>
        </div>

        {/* Main Menu Section - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3">
            <button className="flex items-center gap-3 w-full text-neutral-500 hover:text-neutral-300 text-xs font-medium mb-2">
              MAIN MENU
            </button>

            <nav className="space-y-1">
              {sidebar.map((item) => (
                <button
                  key={item.key}
                  onClick={() => navigate(`${item.path}`)}
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                >
                  {item.icon}
                  <span>{item.title}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* My Projects Section */}
          {/* <div className="p-3 mt-4">
            <button
              onClick={() => setIsProjectsOpen(!isProjectsOpen)}
              className="flex items-center gap-3 w-full text-neutral-500 hover:text-neutral-300 text-xs font-medium mb-2"
            >
              MY PROJECTS
              <ChevronDown
                className={`w-3 h-3 ml-auto transition-transform ${
                  !isProjectsOpen ? "-rotate-90" : ""
                }`}
              />
            </button>

            {isProjectsOpen && (
              <nav className="space-y-1">
                <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer">
                  <div className="w-2 h-2 bg-neutral-400 rounded-full"></div>
                  <span>Internship Applications</span>
                </button>

                <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer">
                  <div className="w-2 h-2 bg-neutral-500 rounded-full"></div>
                  <span>Interview Prep</span>
                </button>

                <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer">
                  <div className="w-2 h-2 bg-neutral-600 rounded-full"></div>
                  <span>Resume Updates</span>
                  <span className="ml-auto text-xs text-neutral-500">8</span>
                </button>

                <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer">
                  <div className="w-2 h-2 bg-neutral-700 rounded-full"></div>
                  <span>Follow-ups</span>
                </button>
              </nav>
            )}
          </div> */}
        </div>
      </aside>

      {/* Main Content Area - Flex Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header - Fixed at Top */}
        <header className="bg-white border-b border-neutral-200 px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0 justify-between flex-shrink-0">
          <div className="flex items-center gap-4 flex-1 w-full sm:max-w-2xl ml-0 lg:ml-0 pl-0 sm:pl-0 lg:pl-0">
            <Search className="w-5 h-5 text-neutral-400 hidden sm:block" />
            <input
              type="text"
              placeholder="What are you working on..."
              className="flex-1 outline-none text-sm text-neutral-700 placeholder-neutral-400 w-full pl-12 sm:pl-0 lg:pl-0"
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Main Content Area - Scrollable Only */}
        <main className="flex-1 overflow-y-auto bg-neutral-50">
          <div className="p-4 sm:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
