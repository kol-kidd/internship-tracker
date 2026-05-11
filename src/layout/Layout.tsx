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
  "/logs": "Journal",
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
      title: "Journal",
      path: "/logs",
      icon: <ClipboardClock className="w-4 h-4" />,
    },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error(error);
    }
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-surface font-sans">
      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden
          className="lg:hidden fixed inset-0 bg-black/20 z-30 transition-opacity"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 border-r border-border bg-canvas flex flex-col
        transition-transform duration-200
        lg:translate-x-0 glass
        ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        {/* Logo Section */}
        <button
          onClick={() => handleNavClick("/")}
          className="p-6 flex items-center gap-3 shrink-0 hover:bg-surface transition-colors cursor-pointer text-left"
        >
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm tracking-tight">
              IP
            </span>
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-base text-text tracking-tight">
              InternPal
            </h1>
            <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
              Student Workspace
            </p>
          </div>
        </button>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-1">
          <p className="px-3 text-[11px] font-bold text-text-muted uppercase tracking-[0.15em] mb-2 opacity-60">
            Menu
          </p>

          <nav className="space-y-1">
            {sidebar.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.path)}
                  className={`
                    flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium
                    transition-all duration-200 cursor-pointer group
                    ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-text-muted hover:bg-black/5 hover:text-text"
                    }
                  `}
                >
                  <div
                    className={isActive ? "text-white" : "text-primary opacity-70"}
                  >
                    {item.icon}
                  </div>
                  <span>{item.title}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User / Logout Section */}
        <div className="p-4 mt-auto border-t border-border">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-surface mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary">
              {firstName[0]}
            </div>
            <div className="min-w-0 overflow-hidden">
              <p className="text-sm font-semibold text-text truncate leading-none mb-1">
                {user?.user_metadata?.full_name}
              </p>
              <p className="text-[11px] text-text-muted truncate opacity-80">
                Logged in
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg text-sm font-semibold text-error bg-error/5 hover:bg-error/10 transition-colors cursor-pointer border border-error/10"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 shrink-0 z-20 bg-canvas border-b border-border">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-black/5 text-text hover:bg-black/10 transition-colors"
              aria-label="Toggle Menu"
            >
              {isMobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] leading-none mb-1">
                {pageTitle}
              </span>
              <h2 className="text-lg font-semibold text-text tracking-tight flex items-center gap-2">
                {greeting}, {firstName}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline text-xs font-medium text-text-muted">
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-surface relative">
          <div className="max-w-[1600px] mx-auto p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
