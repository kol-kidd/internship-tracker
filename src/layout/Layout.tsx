import React, { useEffect, useState } from "react";
import {
  Menu,
  X,
  LogOut,
  LayoutPanelLeft,
  NotebookText,
  ClipboardClock,
} from "lucide-react";
import { signOut } from "@/functions/auth/signOut";
import { useAuthStore } from "@/store/authStore";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppStore } from "@/store/applicationStore";
import { useJournalStore } from "@/store/journalStore";

const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/applications": "Applications",
  "/logs": "Logs",
};

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const pageTitle = routeTitles[location.pathname] ?? "InternPal";
  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  })();
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] ?? "there";

  const { fetchApplications, initSocket } = useAppStore();

  const { fetchEntries } = useJournalStore();

  useEffect(() => {
    if (user?.id) {
      fetchApplications();
      fetchEntries();
      initSocket();
    }
  }, [user?.id, fetchApplications, fetchEntries, initSocket]);

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

  const handleNavClick = (path: string) => {
    navigate(path);
    setIsMobileSidebarOpen(false);
  };

  const handleLogoutAndClose = () => {
    handleLogout();
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-surface">
      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar - Drawer on mobile, static on desktop */}
      <aside
        className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-sidebar border-r border-sidebar-border flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${
          isMobileSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }
      `}
      >
        {/* Logo */}
        <div className="p-4 border-b border-sidebar-border flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">IP</span>
          </div>
          <div className="min-w-0">
            <h1 className="font-semibold text-sm text-white truncate">
              InternPal
            </h1>
            <p className="text-xs text-sidebar-text truncate">
              {user?.user_metadata?.full_name}
            </p>
          </div>
        </div>

        {/* Main Menu Section - Scrollable */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          <div className="p-3">
            <span className="flex items-center gap-3 w-full text-sidebar-text-muted text-xs font-medium mb-2">
              MAIN MENU
            </span>

            <nav className="space-y-0.5">
              {sidebar.map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.path)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 min-h-[44px] text-left text-sm text-sidebar-text hover:bg-primary/20 rounded-lg transition-colors cursor-pointer touch-manipulation"
                >
                  {item.icon}
                  <span>{item.title}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Logout - inside menu on mobile only */}
          <div className="mt-auto p-3 border-t border-sidebar-border lg:hidden">
            <button
              onClick={handleLogoutAndClose}
              className="flex items-center gap-3 w-full px-3 py-2.5 min-h-[44px] text-left text-sm text-sidebar-text hover:bg-primary/20 rounded-lg transition-colors cursor-pointer touch-manipulation"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Logout</span>
            </button>
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
        {/* Header - Menu (mobile) + title/greeting + Logout (desktop) */}
        <header className="bg-canvas border-b border-border px-4 sm:px-6 py-3 flex items-center gap-3 sm:gap-4 justify-between shrink-0 min-h-[56px]">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="lg:hidden shrink-0 w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-text-muted hover:bg-accent/30 hover:text-text transition-colors touch-manipulation"
              aria-label={isMobileSidebarOpen ? "Close menu" : "Open menu"}
            >
              {isMobileSidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
            <div className="flex flex-col min-w-0 flex-1 py-0.5">
              <h2 className="text-xs sm:text-sm font-medium text-text-muted truncate">
                {pageTitle}
              </h2>
              <p className="text-sm sm:text-base font-semibold text-text truncate">
                {greeting}, {firstName}
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Main Content - Scrollable */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-surface">
          <div className="p-4 sm:p-6 min-h-0">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
