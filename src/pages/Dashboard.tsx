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
  FileEdit,
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
  const navigate = useNavigate();

  const { applications, loading } = useAppStore();
  const { entries } = useJournalStore();

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

  return (
    <>
      <SEO
        title="Dashboard"
        description="View your applications, interviews, offers, and journal progress."
      />
      <div className="space-y-8">
        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold text-text tracking-tight">
              Overview
            </h1>
            <p className="text-text-muted">
              Track applications and journal progress in one place.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleModal}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors"
            >
              <Plus size={18} />
              <span>Add Application</span>
            </button>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-6">
          {/* Stats Cards */}
          {stats.map((stat, i) => (
            <div
              key={i}
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

          {/* Recent Activity */}
          <div className="md:col-span-3 lg:col-span-2 rounded-2xl bg-canvas border border-border/50 flex flex-col overflow-hidden shadow-sm">
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
                title="View All"
              >
                <ArrowRight size={20} />
              </button>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="space-y-4 ">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-surface rounded-2xl" />
                  ))}
                </div>
              ) : applications.length > 0 ? (
                <div className="space-y-4">
                  {recentApplicationsSorted.map((app, index) => {
                    const statusData = getStatusConfig(app.status);
                    return (
                      <div
                        key={index}
                        onClick={() => navigate("/applications")}
                        className="group flex items-center justify-between p-4 rounded-xl hover:bg-surface transition-colors cursor-pointer border border-transparent hover:border-border/50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Building2 size={24} />
                          </div>
                          <div>
                            <p className="font-bold text-text leading-tight group-hover:text-primary transition-colors">
                              {app.company_name}
                            </p>
                            <p className="text-xs font-medium text-text-muted tracking-wide">
                              {app.position || "Developer"} •{" "}
                              {dayjs(app.date_applied).format("MMM DD, YYYY")}
                            </p>
                          </div>
                        </div>
                        <span
                          className="px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider"
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
                <div className="py-12 flex flex-col items-center justify-center text-center opacity-50">
                  <Briefcase size={48} className="mb-4 text-text-muted" />
                  <p className="text-sm font-bold uppercase tracking-widest text-text-muted">
                    No applications found
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Journal Stats Card */}
          <div className="md:col-span-1 lg:col-span-1 rounded-2xl bg-canvas border border-border/50 p-6 flex flex-col justify-between shadow-sm">
            <div className="space-y-6">
              <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center text-info">
                <Calendar size={28} />
              </div>
              <h2 className="text-xl font-semibold text-text tracking-tight">
                Journal Records
              </h2>
              <div className="space-y-4 mt-8">
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
                    {totalHoursLogged.toFixed(1)}h
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate("/logs")}
              className="w-full mt-8 py-3 rounded-lg border border-border text-sm font-semibold text-text hover:bg-surface transition-colors flex items-center justify-center gap-2"
            >
              Go to Journal
            </button>
          </div>

          {/* Journal tools card */}
          <div
            onClick={() => navigate("/logs")}
            className="md:col-span-4 lg:col-span-1 rounded-2xl bg-canvas border border-border/50 p-6 text-text cursor-pointer group shadow-sm"
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
                <p className="text-sm text-text-muted leading-relaxed max-w-[220px]">
                  Improve wording, suggest tags, and prepare summaries from
                  your logs.
                </p>
              </div>

              <div className="mt-8 flex items-center justify-between">
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
        </div>
      </div>

      <Modal open={open} handleModal={handleModal} />
    </>
  );
}

import { Plus } from "lucide-react";
