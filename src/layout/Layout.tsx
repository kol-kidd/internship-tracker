import React, { useState } from "react";
import {
  Calendar,
  Timer,
  Bell,
  Settings,
  ChevronDown,
  ChevronRight,
  Plus,
  Search,
  Clock,
  Play,
  Menu,
  X,
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [isProjectsOpen, setIsProjectsOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleLogout = async () => {
    console.log("Logging out...");
  };

  return (
    <div className="min-h-screen flex bg-neutral-50">
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

      {/* Sidebar */}
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
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-neutral-900 font-bold text-sm">OJT</span>
            </div>
            <div>
              <h1 className="font-semibold text-sm text-white">OJT Tracker</h1>
              <p className="text-xs text-neutral-400">Free Trial</p>
            </div>
          </div>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-neutral-400 hover:text-neutral-300"
          >
            <ChevronRight
              className={`w-4 h-4 transition-transform ${
                isMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {/* Main Menu Section */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3">
            <button className="flex items-center gap-3 w-full text-neutral-500 hover:text-neutral-300 text-xs font-medium mb-2">
              MAIN MENU
              <ChevronDown className="w-3 h-3 ml-auto" />
            </button>

            <nav className="space-y-1">
              <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors">
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>

              <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors">
                <Calendar className="w-4 h-4" />
                <span>Calendar</span>
              </button>

              <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors">
                <Timer className="w-4 h-4" />
                <span>Timer</span>
              </button>

              <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors">
                <Bell className="w-4 h-4" />
                <span>Notification</span>
                <span className="ml-auto bg-neutral-800 text-neutral-300 text-xs px-2 py-0.5 rounded-full font-medium">
                  99+
                </span>
              </button>

              <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
            </nav>
          </div>

          {/* My Projects Section */}
          <div className="p-3 mt-4">
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
                <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors">
                  <div className="w-2 h-2 bg-neutral-400 rounded-full"></div>
                  <span>Internship Applications</span>
                </button>

                <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors">
                  <div className="w-2 h-2 bg-neutral-500 rounded-full"></div>
                  <span>Interview Prep</span>
                </button>

                <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors">
                  <div className="w-2 h-2 bg-neutral-600 rounded-full"></div>
                  <span>Resume Updates</span>
                  <span className="ml-auto text-xs text-neutral-500">8</span>
                </button>

                <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors">
                  <div className="w-2 h-2 bg-neutral-700 rounded-full"></div>
                  <span>Follow-ups</span>
                </button>
              </nav>
            )}
          </div>

          {/* Accounts Section */}
          <div className="p-3 mt-4">
            <button className="flex items-center gap-3 w-full text-neutral-500 hover:text-neutral-300 text-xs font-medium mb-2">
              ACCOUNTS
              <Plus className="w-3 h-3 ml-auto" />
            </button>

            <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors">
              <div className="w-6 h-6 bg-neutral-700 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                ZS
              </div>
              <span className="truncate">Zulkifli Syukur</span>
            </button>
          </div>
        </div>

        {/* Upgrade Section */}
        <div className="p-4 border-t border-neutral-800">
          <div className="bg-neutral-800 rounded-xl p-4 text-center border border-neutral-700">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🚀</span>
            </div>
            <h3 className="font-semibold text-sm mb-1 text-white">
              Upgrade to Pro!
            </h3>
            <p className="text-xs text-neutral-400 mb-3">
              Unlock all features by upgrading to Pro.
            </p>
            <button className="w-full bg-white hover:bg-neutral-200 text-neutral-900 text-sm font-medium py-2 px-4 rounded-lg transition-colors">
              Upgrade Now
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Header */}
        <header className="bg-white border-b border-neutral-200 px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0 justify-between">
          <div className="flex items-center gap-4 flex-1 w-full sm:max-w-2xl ml-0 lg:ml-0 pl-0 sm:pl-0 lg:pl-0">
            <Search className="w-5 h-5 text-neutral-400 hidden sm:block" />
            <input
              type="text"
              placeholder="What are you working on..."
              className="flex-1 outline-none text-sm text-neutral-700 placeholder-neutral-400 w-full pl-12 sm:pl-0 lg:pl-0"
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            <button className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors">
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Task</span>
            </button>

            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-neutral-700 border border-neutral-200 rounded-lg">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="font-mono text-xs">00:00:00</span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <Play className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Start</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-neutral-50 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
