import { useState } from "react";
import dayjs from "dayjs";
import { useAppStore } from "@/store/applicationStore";
import { useJournalStore } from "@/store/journalStore";
import { useNavigate } from "react-router-dom";
import Modal from "@/components/Application/Modal";
import SEO from "@/components/SEO";
import {
  Briefcase,
  Building2,
  Clock,
  MessageSquare,
  Trophy,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Calendar,
} from "lucide-react";

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
    color: { bg: "#d0e0e6", text: "#4a6a75", border: "#b8d0d8" },
  },
  interviewing: {
    label: "Interviewing",
    color: { bg: "#e6e0f0", text: "#5a5070", border: "#d0c8e0" },
  },
  offer: {
    label: "Offer Received",
    color: { bg: "#d4edda", text: "#2d5a36", border: "#b8ddc4" },
  },
  rejected: {
    label: "Rejected",
    color: { bg: "#f4d8d8", text: "#8b4a4a", border: "#e8c4c4" },
  },
  accepted: {
    label: "Accepted",
    color: { bg: "#d4edda", text: "#2d5a36", border: "#a7d4b4" },
  },
  withdrawn: {
    label: "Withdrawn",
    color: { bg: "#e8e4df", text: "#4a4540", border: "#d0cbc4" },
  },
};

const getStatusConfig = (status: string): StatusConfig => {
  const normalizedStatus = status.toLowerCase() as StatusType;
  return statusConfig[normalizedStatus] || statusConfig.applied;
};

export default function Dashboard() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const { applications, loading } = useAppStore();
  const { entries } = useJournalStore();

  const applicationsCount = applications.length;
  const inProgressCount = applications.filter(
    (app) => app.status.toLowerCase() === "applied"
  ).length;
  const interviewsCount = applications.filter(
    (app) => app.status.toLowerCase() === "interviewing"
  ).length;
  const offersCount = applications.filter(
    (app) => app.status.toLowerCase() === "offer"
  ).length;

  const acceptedApplications = applications.filter(
    (app) => app.status.toLowerCase() === "accepted"
  );
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

  // Calculate total hours logged
  const totalHoursLogged = entries.reduce((total, entry) => {
    if (entry.time_in && entry.time_out) {
      const [inHour, inMin] = entry.time_in.split(":").map(Number);
      const [outHour, outMin] = entry.time_out.split(":").map(Number);
      const breakMins = entry.break_time || 0;
      const mins = outHour * 60 + outMin - (inHour * 60 + inMin) - breakMins;
      return total + mins / 60;
    }
    return total;
  }, 0);

  const handleModal = () => {
    setOpen(!open);
  };

  const stats = [
    {
      label: "Applications",
      value: applicationsCount,
      icon: Briefcase,
      bgClass: "bg-primary",
      change: "+3 this week",
    },
    {
      label: "In Progress",
      value: inProgressCount,
      icon: Clock,
      bgClass: "bg-soft-blue",
      change: "Active",
    },
    {
      label: "Interviews",
      value: interviewsCount,
      icon: MessageSquare,
      bgClass: "bg-soft-pink",
      change: "Scheduled",
    },
    {
      label: "Offers",
      value: offersCount,
      icon: Trophy,
      bgClass: "bg-soft-green",
      change: "Received",
    },
  ];

  return (
    <>
      <SEO
        title="Dashboard"
        description="View your internship application stats, recent activity, and AI-powered insights all in one place."
      />
      <div className="min-h-full">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-soft-blue animate-pulse" />
                <span className="text-xs font-medium text-soft-blue uppercase tracking-wider">
                  Dashboard
                </span>
              </div>
              <h1 className="text-3xl font-bold text-text">Welcome back</h1>
              <p className="text-text-muted mt-1">
                Here's your internship search at a glance
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleModal}
                className="group flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-all "
              >
                <span>+ Add Application</span>
              </button>
              <button
                onClick={() => navigate("/applications")}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border text-sm font-medium text-text hover:bg-accent/30 transition-all"
              >
                <span>View All</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {acceptedApplications.length > 0 && (
            <div className="rounded-2xl border border-border bg-canvas p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-soft-green flex items-center justify-center shrink-0">
                  <Trophy className="w-5 h-5 text-white shrink-0" strokeWidth={2.25} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-text truncate">
                    You accepted an offer at{" "}
                    {acceptedApplications[0].company_name}
                  </p>
                  <p className="text-sm text-text-muted">
                    {acceptedApplications[0].position
                      ? `${acceptedApplications[0].position} • `
                      : ""}
                    View and manage your applications
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate("/applications")}
                className="shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl border border-border text-sm font-medium text-text hover:bg-accent/30 transition-all touch-manipulation"
              >
                <span>View applications</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="group relative bg-canvas rounded-2xl border border-border p-6 hover:border-primary/30 transition-all hover:shadow-sm overflow-hidden"
              >
                <div className="relative">
                  <div
                    className={`w-10 h-10 rounded-xl ${stat.bgClass} flex items-center justify-center mb-4`}
                  >
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>

                  <p className="text-sm text-text-muted mb-1">{stat.label}</p>
                  <div className="flex items-end justify-between">
                    <p className="text-3xl font-bold text-text">
                      {loading ? (
                        <span className="inline-block w-8 h-8 rounded bg-border animate-pulse" />
                      ) : (
                        stat.value
                      )}
                    </p>
                    <span className="text-xs text-text-muted">
                      {stat.change}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Applications */}
            <div className="lg:col-span-2 bg-canvas rounded-2xl border border-border overflow-hidden">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-primary" />
                    </div>
                    <h2 className="text-lg font-semibold text-text">
                      Recent Applications
                    </h2>
                  </div>
                  <button
                    onClick={() => navigate("/applications")}
                    className="text-sm text-primary hover:text-primary-hover font-medium flex items-center gap-1"
                  >
                    View all
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-4 rounded-xl bg-surface animate-pulse"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-border" />
                          <div className="space-y-2">
                            <div className="w-32 h-4 rounded bg-border" />
                            <div className="w-24 h-3 rounded bg-border" />
                          </div>
                        </div>
                        <div className="w-20 h-6 rounded-full bg-border" />
                      </div>
                    ))}
                  </div>
                ) : applications.length > 0 ? (
                  <div className="space-y-3">
                    {recentApplicationsSorted.map((app, index) => {
                      const statusData = getStatusConfig(app.status);
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 rounded-xl bg-surface hover:bg-accent/20 transition-colors cursor-pointer group"
                          onClick={() => navigate("/applications")}
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shrink-0">
                              <Building2 className="w-5 h-5 shrink-0" strokeWidth={2} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-text group-hover:text-primary transition-colors">
                                {app.company_name}
                              </p>
                              <p className="text-sm text-text-muted">
                                {app.position ? `${app.position} • ` : ""}
                                {dayjs(app.date_applied).format("MMM DD")}
                              </p>
                            </div>
                          </div>
                          <span
                            className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: statusData.color.bg,
                              color: statusData.color.text,
                              border: `1px solid ${statusData.color.border}`,
                            }}
                          >
                            {statusData.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-border flex items-center justify-center mx-auto mb-4">
                      <Briefcase className="w-8 h-8 text-primary/50" />
                    </div>
                    <p className="text-text-muted font-medium">
                      No applications yet
                    </p>
                    <p className="text-sm text-text-muted mt-1">
                      Start tracking your internship applications
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* AI-Powered Journal */}
              <div
                onClick={() => navigate("/logs")}
                className="bg-sidebar rounded-2xl p-6 text-white relative overflow-hidden cursor-pointer hover:shadow-md transition-all group"
              >
                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-soft-blue" />
                    <span className="text-sm font-medium text-soft-blue">
                      AI-Powered Journal
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-soft-green/40 text-white">
                      Active
                    </span>
                  </div>

                  <p className="text-white/80 text-sm leading-relaxed mb-3">
                    Enhance your journal entries with AI. Improve writing,
                    expand ideas, and get smart tag suggestions.
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 rounded-lg bg-white/10 text-white/70">
                      ✨ Improve Writing
                    </span>
                    <span className="text-xs px-2 py-1 rounded-lg bg-white/10 text-white/70">
                      📝 Expand Content
                    </span>
                    <span className="text-xs px-2 py-1 rounded-lg bg-white/10 text-white/70">
                      🏷️ Smart Tags
                    </span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-soft-green animate-pulse" />
                        Powered by Gemini AI
                      </div>
                      <ArrowRight className="w-4 h-4 text-white/50 group-hover:text-white/80 transition-colors" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-canvas rounded-2xl border border-border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-soft-blue/20 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-soft-blue" />
                  </div>
                  <h2 className="text-lg font-semibold text-text">
                    Journal Stats
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-surface">
                    <span className="text-sm text-text-muted">
                      Total Entries
                    </span>
                    <span className="font-semibold text-text">
                      {entries.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-surface">
                    <span className="text-sm text-text-muted">
                      Hours Logged
                    </span>
                    <span className="font-semibold text-text">
                      {totalHoursLogged.toFixed(1)}h
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => navigate("/logs")}
                  className="w-full mt-4 py-3 rounded-xl border border-border text-sm font-medium text-primary hover:bg-accent/30 transition-colors flex items-center justify-center gap-2"
                >
                  View Journal
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <Modal open={open} handleModal={handleModal} />
      </div>
    </>
  );
}
