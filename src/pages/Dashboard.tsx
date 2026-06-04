import { useEffect, useState } from "react";
import dayjs from "dayjs";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  Briefcase,
  Building2,
  CalendarCheck,
  CheckCircle2,
  Clock,
  FileEdit,
  MessageSquare,
  Plus,
  Trophy,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Modal from "@/components/Application/Modal";
import CertificateModal from "@/components/CertificateModal";
import type { CertificateData } from "@/components/Certificate";
import SEO from "@/components/SEO";
import { useAppStore } from "@/store/applicationStore";
import { useAuthStore } from "@/store/authStore";
import { useJournalStore } from "@/store/journalStore";
import { useProfileStore } from "@/store/profileStore";
import { useGalleryStore } from "@/store/galleryStore";
import ReportReadinessPanel from "@/components/ReportReadinessPanel";
import { DEFAULT_REQUIRED_HOURS } from "@/lib/academicPresets";
import {
  getReportReadiness,
  type ReadinessTarget,
} from "@/lib/reportReadiness";
import {
  countIncompleteTimeEntries,
  formatLogDate,
  getLatestValidLogDate,
  getTotalLoggedHours,
  hasEntryOnDate,
  toLocalDateInputValue,
} from "@/lib/hours";

type StatusType =
  | "applied"
  | "interviewing"
  | "offer"
  | "rejected"
  | "accepted"
  | "withdrawn";

interface StatusConfig {
  label: string;
  color: { bg: string; text: string; border: string };
}

const statusConfig: Record<StatusType, StatusConfig> = {
  applied: {
    label: "Applied",
    color: {
      bg: "rgba(0, 113, 227, 0.05)",
      text: "#0071e3",
      border: "rgba(0, 113, 227, 0.1)",
    },
  },
  interviewing: {
    label: "Interviewing",
    color: {
      bg: "rgba(175, 82, 222, 0.05)",
      text: "#af52de",
      border: "rgba(175, 82, 222, 0.1)",
    },
  },
  offer: {
    label: "Offer",
    color: {
      bg: "rgba(40, 205, 65, 0.05)",
      text: "#28cd41",
      border: "rgba(40, 205, 65, 0.1)",
    },
  },
  rejected: {
    label: "Rejected",
    color: {
      bg: "rgba(255, 59, 48, 0.05)",
      text: "#ff3b30",
      border: "rgba(255, 59, 48, 0.1)",
    },
  },
  accepted: {
    label: "Accepted",
    color: {
      bg: "rgba(40, 205, 65, 0.1)",
      text: "#28cd41",
      border: "rgba(40, 205, 65, 0.2)",
    },
  },
  withdrawn: {
    label: "Withdrawn",
    color: {
      bg: "rgba(142, 142, 147, 0.05)",
      text: "#8e8e93",
      border: "rgba(142, 142, 147, 0.1)",
    },
  },
};

const getStatusConfig = (status: string): StatusConfig => {
  const normalizedStatus = status.toLowerCase() as StatusType;
  return statusConfig[normalizedStatus] || statusConfig.applied;
};

export default function Dashboard() {
  const [open, setOpen] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const navigate = useNavigate();

  const { user } = useAuthStore();
  const { applications, loading } = useAppStore();
  const { entries } = useJournalStore();
  const { profile } = useProfileStore();
  const { images: galleryImages, fetchGallery } = useGalleryStore();

  useEffect(() => {
    if (entries.length > 0) void fetchGallery();
  }, [entries.length, fetchGallery]);

  const applicationsCount = applications.length;
  const inProgressCount = applications.filter(
    (app) => app.status.toLowerCase() === "applied",
  ).length;
  const interviewsCount = applications.filter(
    (app) => app.status.toLowerCase() === "interviewing",
  ).length;
  const offersCount = applications.filter(
    (app) => app.status.toLowerCase() === "offer",
  ).length;

  const today = toLocalDateInputValue();
  const fallbackTotalHours = getTotalLoggedHours(entries);
  const totalHoursLogged = profile?.total_hours ?? fallbackTotalHours;
  const requiredHours = profile?.required_hours ?? DEFAULT_REQUIRED_HOURS;
  const progressPercent =
    requiredHours > 0 ? Math.min(100, (totalHoursLogged / requiredHours) * 100) : 0;
  const hoursRemaining = Math.max(0, requiredHours - totalHoursLogged);
  const latestLogDate = getLatestValidLogDate(entries);
  const incompleteLogCount = countIncompleteTimeEntries(entries);
  const hasTodayLog = hasEntryOnDate(entries, today);
  const completed = Boolean(profile?.hours_completed_at);
  const setupIncomplete = !profile?.school || !profile?.course;
  const readiness = getReportReadiness({
    entries,
    images: galleryImages,
    profile,
  });

  const recentApplicationsSorted = [...applications]
    .sort((a, b) => {
      const aAccepted = a.status.toLowerCase() === "accepted";
      const bAccepted = b.status.toLowerCase() === "accepted";
      if (aAccepted && !bAccepted) return -1;
      if (!aAccepted && bAccepted) return 1;
      return (
        new Date(b.date_applied).getTime() - new Date(a.date_applied).getTime()
      );
    })
    .slice(0, 5);

  const stats = [
    {
      label: "Total Apps",
      value: applicationsCount,
      icon: Briefcase,
      color: "text-primary",
      bg: "bg-primary/10",
      description: "Lifetime tracking",
    },
    {
      label: "In Progress",
      value: inProgressCount,
      icon: Clock,
      color: "text-info",
      bg: "bg-info/10",
      description: "Active search",
    },
    {
      label: "Interviews",
      value: interviewsCount,
      icon: MessageSquare,
      color: "text-warning",
      bg: "bg-warning/10",
      description: "Scheduled",
    },
    {
      label: "Offers",
      value: offersCount,
      icon: Trophy,
      color: "text-success",
      bg: "bg-success/10",
      description: "Outstanding",
    },
  ];

  const certificateData: CertificateData = {
    name: profile?.full_name || user?.user_metadata?.full_name || "Intern",
    school: profile?.school ?? null,
    course: profile?.course ?? null,
    hours: profile?.required_hours ?? totalHoursLogged,
    date: profile?.hours_completed_at ?? "",
  };

  const handlePrimaryProgressAction = () => {
    if (completed) {
      setShowCertificate(true);
      return;
    }

    navigate("/logs?new=today");
  };

  const handleReadinessAction = (target: ReadinessTarget) => {
    if (target === "profile") {
      navigate("/profile");
      return;
    }

    const view = target === "evidence" ? "evidence" : target;
    navigate(`/logs?view=${view}`);
  };

  return (
    <>
      <SEO
        title="Dashboard"
        description="View your internship progress, applications, and journal activity."
      />
      <div className="space-y-6">
        <section className="app-hero-panel overflow-hidden p-5 sm:p-6 lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-stretch">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-primary">
                <CalendarCheck className="w-4 h-4" />
                Today's Internship Focus
              </div>
              <h1 className="mt-4 max-w-3xl text-2xl font-semibold tracking-tight text-text sm:text-3xl lg:text-4xl">
                {completed
                  ? "Your required hours are complete."
                  : hasTodayLog
                    ? "Today's log is started. Finish it with proof while it is fresh."
                    : "Log today, track the search, and keep your certificate moving."}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">
                {completed
                  ? `Completed on ${formatLogDate(profile?.hours_completed_at)}. Your certificate is ready for download.`
                  : `${hoursRemaining.toFixed(1)} hours left before your certificate unlocks. Keep applications, journal entries, and evidence moving from one workspace.`}
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handlePrimaryProgressAction}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgb(11_115_217_/_0.2)] transition-colors hover:bg-primary-hover"
                >
                  {completed ? <Award className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {completed ? "View Certificate" : "Log today's hours"}
                </button>
                <button
                  onClick={() => setOpen(true)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-canvas px-5 py-3 text-sm font-semibold text-text transition-colors hover:bg-surface"
                >
                  <Briefcase className="w-4 h-4" />
                  Add Application
                </button>
              </div>

              <div className="mt-8 max-w-3xl">
                <div className="mb-2 flex items-end justify-between gap-4">
                  <p className="text-3xl font-bold tracking-tight text-text">
                    {totalHoursLogged.toFixed(1)}
                    <span className="text-base font-medium text-text-muted">
                      {" "}
                      / {requiredHours} hrs
                    </span>
                  </p>
                  <p className="text-sm font-bold text-primary">
                    {progressPercent.toFixed(0)}%
                  </p>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-canvas shadow-inner">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <aside className="rounded-2xl border border-border bg-canvas/80 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                    Progress Snapshot
                  </p>
                  <h2 className="mt-1 text-lg font-semibold tracking-tight text-text">
                    Reports-ready details
                  </h2>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileEdit className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-5 divide-y divide-border-subtle">
                <div className="flex items-center justify-between gap-4 py-3">
                  <span className="text-sm text-text-muted">Latest valid log</span>
                  <span className="text-sm font-semibold text-text">
                    {formatLogDate(latestLogDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 py-3">
                  <span className="text-sm text-text-muted">Today</span>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-text">
                    {hasTodayLog ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        Started
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4 text-primary" />
                        Ready
                      </>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 py-3">
                  <span className="text-sm text-text-muted">Incomplete logs</span>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-text">
                    {incompleteLogCount > 0 ? (
                      <>
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        {incompleteLogCount} need time
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        All timed
                      </>
                    )}
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {setupIncomplete && (
          <section className="app-callout flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UserRound className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text">
                  Complete your academic profile
                </p>
                <p className="mt-1 text-xs leading-5 text-text-muted">
                  Add your school and course so certificates and leaderboards use the right details.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/profile")}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              Complete Profile
              <ArrowRight className="w-4 h-4" />
            </button>
          </section>
        )}

        <ReportReadinessPanel
          readiness={readiness}
          variant="compact"
          onAction={handleReadinessAction}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="app-metric-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-text-muted">
                    {stat.label}
                  </p>
                  <h3 className="mt-2 text-3xl font-semibold tracking-tight text-text">
                    {loading ? "..." : stat.value}
                  </h3>
                </div>
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}
                >
                  <stat.icon size={22} strokeWidth={2.5} />
                </div>
              </div>
              <p className="mt-4 border-t border-border-subtle pt-3 text-xs font-medium text-text-muted">
                {stat.description}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="app-panel flex flex-col overflow-hidden lg:col-span-2">
            <div className="flex items-center justify-between gap-4 border-b border-border-subtle p-5 sm:p-6">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-text">
                  Recent Applications
                </h2>
                <p className="mt-1 text-sm font-medium text-text-muted">
                  Latest movement from your internship search
                </p>
              </div>
              <button
                onClick={() => navigate("/applications")}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-surface hover:text-text"
                title="View all applications"
              >
                <ArrowRight size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 rounded-xl bg-surface" />
                  ))}
                </div>
              ) : applications.length > 0 ? (
                <div className="space-y-3">
                  {recentApplicationsSorted.map((app) => {
                    const statusData = getStatusConfig(app.status);
                    return (
                      <button
                        key={app.id}
                        onClick={() => navigate("/applications")}
                        className="group flex w-full items-center justify-between gap-4 rounded-xl border border-border-subtle bg-surface/70 p-4 text-left transition-colors hover:border-primary/20 hover:bg-canvas"
                      >
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Building2 size={22} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold leading-tight text-text transition-colors group-hover:text-primary">
                              {app.company_name}
                            </p>
                            <p className="mt-1 truncate text-xs font-medium tracking-wide text-text-muted">
                              {app.position || "Developer"} -{" "}
                              {dayjs(app.date_applied).format("MMM DD, YYYY")}
                            </p>
                          </div>
                        </div>
                        <span
                          className="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider"
                          style={{
                            backgroundColor: statusData.color.bg,
                            color: statusData.color.text,
                            border: `1px solid ${statusData.color.border}`,
                          }}
                        >
                          {statusData.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Briefcase size={28} />
                  </div>
                  <p className="text-sm font-bold uppercase tracking-widest text-text-muted">
                    No applications found
                  </p>
                  <button
                    onClick={() => setOpen(true)}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                  >
                    <Plus className="w-4 h-4" />
                    Add Application
                  </button>
                </div>
              )}
            </div>
          </section>

          <section
            onClick={() => navigate("/logs")}
            className="app-accent-panel group cursor-pointer p-6 text-text"
          >
            <div className="flex h-full flex-col justify-between">
              <div>
                <div className="mb-6 flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileEdit size={20} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                    Journal Tools
                  </span>
                </div>
                <h2 className="mb-3 text-xl font-semibold tracking-tight">
                  Turn daily work into clean proof.
                </h2>
                <p className="max-w-[280px] text-sm leading-6 text-text-muted">
                  Review hours, tighten entries, and keep evidence ready for reports.
                </p>
              </div>

              <div className="mt-8 divide-y divide-border-subtle">
                <div className="flex items-center justify-between gap-4 py-3">
                  <span className="text-sm font-medium text-text-muted">
                    Entries
                  </span>
                  <span className="text-lg font-semibold text-text">
                    {entries.length}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 py-3">
                  <span className="text-sm font-medium text-text-muted">
                    Logged Time
                  </span>
                  <span className="text-lg font-semibold text-text">
                    {fallbackTotalHours.toFixed(1)}h
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 pt-4">
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-text-muted">
                    Open Journal
                  </span>
                  <ArrowRight
                    size={20}
                    className="transition-transform group-hover:translate-x-1.5"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <Modal open={open} handleModal={() => setOpen((current) => !current)} />
      <CertificateModal
        open={showCertificate}
        onClose={() => setShowCertificate(false)}
        data={certificateData}
      />
    </>
  );
}
