import React, { useEffect, useState } from "react";
import {
  CalendarCheck,
  ChevronRight,
  Menu,
  X,
  LogOut,
  LayoutPanelLeft,
  NotebookText,
  ClipboardClock,
  FileText,
  UserRound,
  Trophy,
} from "lucide-react";
import { signOut } from "@/functions/auth/signOut";
import { useAuthStore } from "@/store/authStore";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppStore } from "@/store/applicationStore";
import { useJournalStore } from "@/store/journalStore";
import { useProfileStore } from "@/store/profileStore";
import { api } from "@/functions/data/apiClient";
import AppLogo from "@/components/AppLogo";
import {
  getInitial,
  getProfileDisplayName,
  getProfileIndicator,
} from "@/lib/profileIdentity";
import ProfileCompletionModal from "@/components/ProfileCompletionModal";
import CertificateModal from "@/components/CertificateModal";
import type { CertificateData } from "@/components/Certificate";
import {
  celebrateCompletion,
  hasCelebrated,
  markCelebrated,
} from "@/lib/celebrate";

const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/applications": "Applications",
  "/logs": "Journal",
  "/profile": "Profile",
  "/leaderboard": "Leaderboard",
};

const routeSubtitles: Record<string, string> = {
  "/dashboard": "Internship command center",
  "/applications": "Track companies, statuses, and next steps",
  "/logs": "Document hours, evidence, and daily proof",
  "/profile": "Profile, academic details, and appearance",
  "/leaderboard": "Progress across the cohort",
};

const HOURS_SYNC_CACHE_MS = 5 * 60 * 1000;
const lastHoursSyncByUser = new Map<string, number>();

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const isReportsView =
    location.pathname === "/logs" &&
    new URLSearchParams(location.search).get("view") === "reports";
  const isInternshipWorkspace = location.pathname.startsWith("/internships/");
  const pageTitle = isReportsView
    ? "Reports"
    : isInternshipWorkspace
      ? "Internship"
      : routeTitles[location.pathname] ?? "InternPal";
  const pageSubtitle = isReportsView
    ? "School-ready outputs and verification"
    : isInternshipWorkspace
      ? "Accepted internship command center"
      : routeSubtitles[location.pathname] ?? "Keep your internship progress clear";
  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  })();
  const authName = user?.user_metadata?.full_name ?? user?.email ?? null;

  const { fetchApplications, initSocket } = useAppStore();

  const { fetchEntries, initSocket: initJournalSocket } = useJournalStore();

  const { profile, fetchProfile, subscribeToProfile } = useProfileStore();
  const indicatorName = getProfileIndicator(profile, authName);
  const displayName = getProfileDisplayName(profile, authName);
  const totalHours = profile?.total_hours ?? 0;
  const requiredHours = profile?.required_hours ?? null;
  const progressPercent =
    requiredHours && requiredHours > 0
      ? Math.min(100, (totalHours / requiredHours) * 100)
      : 0;
  const [profileCompletionDismissed, setProfileCompletionDismissed] =
    useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const showCompletionModal =
    !!profile && (!profile.school || !profile.course) && !profileCompletionDismissed;

  useEffect(() => {
    if (!user?.id) return;

    const unsubscribeProfile = subscribeToProfile(user.id);

    fetchApplications({ showLoading: false });
    fetchEntries();
    initSocket();
    // Fetch profile then backfill total_hours from existing journal entries.
    // This ensures the leaderboard/profile shows correct hours even for entries
    // logged before the hours-sync feature was added.
    fetchProfile(user.id, { showLoading: false }).then(() => {
      const lastSyncAt = lastHoursSyncByUser.get(user.id) ?? 0;
      if (Date.now() - lastSyncAt < HOURS_SYNC_CACHE_MS) return;

      lastHoursSyncByUser.set(user.id, Date.now());
      api.post("/journal/sync-hours").then(({ data }) => {
        if (typeof data?.total_hours === "number") {
          // Refresh profile store with the newly computed total.
          fetchProfile(user.id, { showLoading: false, force: true });
        }
      }).catch(() => { /* non-critical */ });
    });

    return unsubscribeProfile;
  }, [
    user?.id,
    fetchApplications,
    fetchEntries,
    initSocket,
    fetchProfile,
    subscribeToProfile,
  ]);

  // Real-time completion event from the backend.
  useEffect(() => {
    const handler = () => {
      // Re-fetch so the certificate has fresh hours/date, then celebrate.
      fetchProfile().then(() => {
        if (user?.id) {
          // Force-celebrate on the live event regardless of the "seen" flag.
          markCelebrated(user.id);
          celebrateCompletion();
          setShowCertificate(true);
        }
      });
    };
    window.addEventListener("internpal:hours-completed", handler);
    return () =>
      window.removeEventListener("internpal:hours-completed", handler);
  }, [fetchProfile, user?.id]);

  // Fallback: if profile loads already-completed and we haven't celebrated.
  useEffect(() => {
    if (!user?.id || !profile?.hours_completed_at) return;
    if (hasCelebrated(user.id)) return;

    const timer = window.setTimeout(() => {
      if (!user?.id || hasCelebrated(user.id)) return;
      markCelebrated(user.id);
      celebrateCompletion();
      setShowCertificate(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [user?.id, profile?.hours_completed_at]);

  // Ensure the journal socket (which carries hours-completed) is connected.
  useEffect(() => {
    if (user?.id) initJournalSocket();
  }, [user?.id, initJournalSocket]);

  const certificateData: CertificateData = {
    name: profile?.full_name || user?.user_metadata?.full_name || "Intern",
    school: profile?.school ?? null,
    course: profile?.course ?? null,
    hours: profile?.required_hours ?? profile?.total_hours ?? 0,
    date: profile?.hours_completed_at ?? "",
  };

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
    {
      key: 3,
      title: "Leaderboard",
      path: "/leaderboard",
      icon: <Trophy className="w-4 h-4" />,
    },
    {
      key: 4,
      title: "Profile",
      path: "/profile",
      icon: <UserRound className="w-4 h-4" />,
    },
  ];

  const mobileNav = [
    {
      title: "Dashboard",
      path: "/dashboard",
      icon: <LayoutPanelLeft className="w-4 h-4" />,
      active: location.pathname === "/dashboard",
    },
    {
      title: "Apps",
      path: "/applications",
      icon: <NotebookText className="w-4 h-4" />,
      active:
        location.pathname === "/applications" ||
        location.pathname.startsWith("/internships/"),
    },
    {
      title: "Journal",
      path: "/logs?view=entries",
      icon: <ClipboardClock className="w-4 h-4" />,
      active: location.pathname === "/logs" && !isReportsView,
    },
    {
      title: "Reports",
      path: "/logs?view=reports",
      icon: <FileText className="w-4 h-4" />,
      active: isReportsView,
    },
    {
      title: "Profile",
      path: "/profile",
      icon: <UserRound className="w-4 h-4" />,
      active: location.pathname === "/profile",
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
    <div className="app-shell-root flex overflow-hidden bg-surface font-sans">
      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-30 transition-opacity"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-72 border-r border-sidebar-border bg-sidebar flex flex-col
        transition-transform duration-200
        lg:translate-x-0 app-sidebar
        ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        {/* Logo Section */}
        <button
          onClick={() => handleNavClick("/")}
          className="p-5 flex items-center gap-3 shrink-0 border-b border-sidebar-border hover:bg-surface transition-colors cursor-pointer text-left"
        >
          <AppLogo size={40} />
          <div className="min-w-0">
            <h1 className="font-bold text-base text-text tracking-tight">
              InternPal
            </h1>
            <p className="text-[11px] font-semibold text-sidebar-text-muted uppercase tracking-[0.16em]">
              Student Workspace
            </p>
          </div>
        </button>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-1">
          <p className="px-3 text-[11px] font-bold text-sidebar-text-muted uppercase tracking-[0.16em] mb-2">
            Workspace
          </p>

          <nav className="space-y-1.5">
            {sidebar.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.path)}
                  className={`
                    group flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-semibold
                    transition-all duration-200 cursor-pointer
                    ${
                      isActive
                        ? "bg-primary text-white shadow-[0_10px_24px_rgb(11_115_217_/_0.22)]"
                        : "text-sidebar-text-muted hover:bg-surface hover:text-sidebar-text"
                    }
                  `}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                        isActive
                          ? "bg-white/15 text-white"
                          : "bg-primary/10 text-primary group-hover:bg-primary/15"
                      }`}
                    >
                      {item.icon}
                    </div>
                    <span className="truncate">{item.title}</span>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${
                      isActive
                        ? "opacity-90"
                        : "opacity-0 group-hover:opacity-70 group-hover:translate-x-0.5"
                    }`}
                  />
                </button>
              );
            })}
          </nav>
        </div>

        {/* User / Logout Section */}
        <div className="p-4 mt-auto border-t border-sidebar-border space-y-3">
          <button
            onClick={() => handleNavClick("/profile")}
            className="w-full rounded-2xl border border-border bg-surface/80 p-3 text-left shadow-sm transition-colors hover:bg-surface cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary shrink-0">
                {getInitial(displayName)}
              </div>
              <div className="min-w-0 overflow-hidden">
                <p className="text-sm font-semibold text-text truncate leading-none mb-1">
                  {displayName}
                </p>
                <p className="text-[11px] text-text-muted truncate">
                  {requiredHours
                    ? `${totalHours.toFixed(1)} of ${requiredHours} hours`
                    : "Profile and preferences"}
                </p>
              </div>
            </div>
            {requiredHours ? (
              <div className="mt-3 h-1.5 rounded-full bg-canvas overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            ) : null}
          </button>

          <div className="hidden rounded-2xl border border-border-subtle bg-canvas/70 p-3 lg:block">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
              <CalendarCheck className="h-3.5 w-3.5" />
              Today
            </div>
            <p className="mt-1 text-xs leading-relaxed text-text-muted">
              Capture hours, proof, and application movement while it is still fresh.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-semibold text-error bg-error/5 hover:bg-error/10 transition-colors cursor-pointer border border-error/10"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="app-topbar min-h-[72px] flex items-center justify-between gap-4 px-4 sm:px-6 shrink-0 z-20 bg-canvas/95 border-b border-border backdrop-blur">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-black/5 text-text hover:bg-black/10 transition-colors"
              aria-label="Toggle Menu"
            >
              {isMobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] leading-none mb-1.5">
                {pageTitle}
              </span>
              <h2 className="text-base sm:text-lg font-semibold text-text tracking-tight flex items-center gap-2">
                {greeting}, {indicatorName}
              </h2>
              <p className="hidden sm:block text-xs text-text-muted mt-1">
                {pageSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden md:inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-xs font-semibold text-text-muted">
              <CalendarCheck className="w-3.5 h-3.5 text-primary" />
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="app-main flex-1 min-h-0 overflow-y-auto bg-surface relative">
          <div className="max-w-[1560px] mx-auto p-4 pb-24 sm:p-6 sm:pb-24 md:p-8 lg:pb-8">
            {children}
          </div>
        </main>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-5 gap-1 rounded-2xl border border-border bg-canvas/95 p-1.5 shadow-[0_12px_32px_rgba(16,24,40,0.16)] backdrop-blur lg:hidden">
        {mobileNav.map((item) => (
          <button
            key={item.title}
            type="button"
            onClick={() => handleNavClick(item.path)}
            className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[11px] font-semibold transition-colors ${
              item.active
                ? "bg-primary text-white"
                : "text-text-muted hover:bg-surface hover:text-text"
            }`}
          >
            {item.icon}
            <span className="max-w-full truncate">{item.title}</span>
          </button>
        ))}
      </nav>

      <ProfileCompletionModal
        open={showCompletionModal}
        onClose={() => setProfileCompletionDismissed(true)}
        initial={{
          nickname: profile?.nickname ?? "",
          school: profile?.school ?? "",
          course: profile?.course ?? "",
          program: profile?.program ?? "",
          required_hours: profile?.required_hours ?? null,
        }}
      />

      <CertificateModal
        open={showCertificate}
        onClose={() => setShowCertificate(false)}
        data={certificateData}
      />
    </div>
  );
};

export default Layout;
