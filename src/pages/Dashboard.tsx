import { useState } from "react";
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
import { DEFAULT_REQUIRED_HOURS } from "@/lib/academicPresets";
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

  return (
    <>
      <SEO
        title="Dashboard"
        description="View your internship progress, applications, and journal activity."
      />
      <div className="space-y-6">
        <section className="bg-canvas border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary mb-3">
                <CalendarCheck className="w-4 h-4" />
                Today's Internship Focus
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-text tracking-tight">
                {completed ? "Your required hours are complete." : "Log today and keep your hours moving."}
              </h1>
              <p className="text-sm text-text-muted mt-2 max-w-2xl">
                {completed
                  ? `Completed on ${formatLogDate(profile?.hours_completed_at)}. Your certificate is ready.`
                  : `${hoursRemaining.toFixed(1)} hours left before your certificate unlocks.`}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
              <button
                onClick={handlePrimaryProgressAction}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors"
              >
                {completed ? <Award className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {completed ? "View Certificate" : "Log today's hours"}
              </button>
              <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg border border-border text-text text-sm font-semibold hover:bg-surface transition-colors"
              >
                <Briefcase className="w-4 h-4" />
                Add Application
              </button>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-end justify-between mb-2">
              <p className="text-3xl font-bold text-text">
                {totalHoursLogged.toFixed(1)}
                <span className="text-base font-medium text-text-muted">
                  {" "}
                  / {requiredHours} hrs
                </span>
              </p>
              <p className="text-sm font-semibold text-primary">
                {progressPercent.toFixed(0)}%
              </p>
            </div>
            <div className="h-3 rounded-full bg-surface overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs font-medium text-text-muted mb-1">
                Latest valid log
              </p>
              <p className="text-sm font-semibold text-text">
                {formatLogDate(latestLogDate)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs font-medium text-text-muted mb-1">
                Today
              </p>
              <p className="text-sm font-semibold text-text flex items-center gap-1.5">
                {hasTodayLog ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    Log started
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 text-primary" />
                    No dated log yet
                  </>
                )}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs font-medium text-text-muted mb-1">
                Incomplete logs
              </p>
              <p className="text-sm font-semibold text-text flex items-center gap-1.5">
                {incompleteLogCount > 0 ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    {incompleteLogCount} need time
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    All timed
                  </>
                )}
              </p>
            </div>
          </div>
        </section>

        {setupIncomplete && (
          <section className="bg-canvas border border-primary/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <UserRound className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text">
                  Complete your academic profile
                </p>
                <p className="text-xs text-text-muted mt-1">
                  Add your school and course so certificates and leaderboards use the right details.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/profile")}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors"
            >
              Complete Profile
              <ArrowRight className="w-4 h-4" />
            </button>
          </section>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="p-5 rounded-xl bg-canvas border border-border hover:border-primary/20 transition-colors"
            >
              <div
                className={`w-10 h-10 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}
              >
                <stat.icon size={24} strokeWidth={2.5} />
              </div>
              <p className="text-sm font-medium text-text-muted mb-1">
                {stat.label}
              </p>
              <div className="flex items-end gap-2">
                <h3 className="text-2xl font-semibold text-text tracking-tight">
                  {loading ? "..." : stat.value}
                </h3>
                <span className="text-xs font-medium text-text-muted mb-1">
                  {stat.description}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 rounded-2xl bg-canvas border border-border/50 flex flex-col overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border/50 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-text tracking-tight">
                  Recent Applications
                </h2>
                <p className="text-sm font-medium text-text-muted">
                  Latest activity from your search
                </p>
              </div>
              <button
                onClick={() => navigate("/applications")}
                className="p-2 w-10 h-10 flex items-center justify-center rounded-xl hover:bg-black/5 text-text-muted hover:text-text transition-colors"
                title="View all applications"
              >
                <ArrowRight size={20} />
              </button>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-surface rounded-2xl" />
                  ))}
                </div>
              ) : applications.length > 0 ? (
                <div className="space-y-4">
                  {recentApplicationsSorted.map((app) => {
                    const statusData = getStatusConfig(app.status);
                    return (
                      <button
                        key={app.id}
                        onClick={() => navigate("/applications")}
                        className="group flex items-center justify-between p-4 rounded-xl hover:bg-surface transition-colors cursor-pointer border border-transparent hover:border-border/50 w-full text-left"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <Building2 size={24} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-text leading-tight group-hover:text-primary transition-colors truncate">
                              {app.company_name}
                            </p>
                            <p className="text-xs font-medium text-text-muted tracking-wide truncate">
                              {app.position || "Developer"} -{" "}
                              {dayjs(app.date_applied).format("MMM DD, YYYY")}
                            </p>
                          </div>
                        </div>
                        <span
                          className="px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider shrink-0"
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
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <Briefcase size={48} className="mb-4 text-text-muted" />
                  <p className="text-sm font-bold uppercase tracking-widest text-text-muted">
                    No applications found
                  </p>
                  <button
                    onClick={() => setOpen(true)}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors"
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
            className="rounded-2xl bg-canvas border border-border/50 p-6 text-text cursor-pointer group shadow-sm"
          >
            <div className="h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <FileEdit size={20} className="text-primary" />
                  <span className="text-xs font-semibold text-primary">
                    Journal tools
                  </span>
                </div>
                <h2 className="text-xl font-semibold tracking-tight mb-4">
                  Clean up entries faster.
                </h2>
                <p className="text-sm text-text-muted leading-relaxed max-w-[260px]">
                  Improve wording, suggest tags, and prepare summaries from your logs.
                </p>
              </div>

              <div className="mt-8 space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface">
                  <span className="text-xs font-medium text-text-muted">
                    Entries
                  </span>
                  <span className="text-lg font-semibold text-text">
                    {entries.length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface">
                  <span className="text-xs font-medium text-text-muted">
                    Logged Time
                  </span>
                  <span className="text-lg font-semibold text-text">
                    {fallbackTotalHours.toFixed(1)}h
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3">
                  <span className="text-xs font-medium text-text-muted">
                    Review before saving
                  </span>
                  <ArrowRight
                    size={20}
                    className="group-hover:translate-x-2 transition-transform"
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
