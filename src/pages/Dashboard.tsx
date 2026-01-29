import { useState } from "react";
import dayjs from "dayjs";
import { useAppStore } from "@/store/applicationStore";
import { useJournalStore } from "@/store/journalStore";
import { useNavigate } from "react-router-dom";
import Modal from "@/components/Application/Modal";
import {
  Briefcase,
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
  | "offer received"
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
    color: { bg: "#EFF6FF", text: "#1E40AF", border: "#BFDBFE" },
  },
  interviewing: {
    label: "Interviewing",
    color: { bg: "#F3E8FF", text: "#6B21A8", border: "#D8B4FE" },
  },
  "offer received": {
    label: "Offer Received",
    color: { bg: "#D1FAE5", text: "#065F46", border: "#A7F3D0" },
  },
  rejected: {
    label: "Rejected",
    color: { bg: "#FEE2E2", text: "#991B1B", border: "#FECACA" },
  },
  accepted: {
    label: "Accepted",
    color: { bg: "#D1FAE5", text: "#065F46", border: "#6EE7B7" },
  },
  withdrawn: {
    label: "Withdrawn",
    color: { bg: "#F3F4F6", text: "#374151", border: "#D1D5DB" },
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
    (app) => app.status.toLowerCase() === "offer received",
  ).length;

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
      gradient: "from-[#7C3AED] to-[#A78BFA]",
      change: "+3 this week",
    },
    {
      label: "In Progress",
      value: inProgressCount,
      icon: Clock,
      gradient: "from-[#38BDF8] to-[#7DD3FC]",
      change: "Active",
    },
    {
      label: "Interviews",
      value: interviewsCount,
      icon: MessageSquare,
      gradient: "from-[#F472B6] to-[#FB7185]",
      change: "Scheduled",
    },
    {
      label: "Offers",
      value: offersCount,
      icon: Trophy,
      gradient: "from-[#34D399] to-[#6EE7B7]",
      change: "Received",
    },
  ];

  return (
    <div className="min-h-full">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse" />
              <span className="text-xs font-medium text-[#38BDF8] uppercase tracking-wider">
                Dashboard
              </span>
            </div>
            <h1 className="text-3xl font-bold text-[#1E1B4B]">Welcome back</h1>
            <p className="text-[#1E1B4B]/60 mt-1">
              Here's your internship search at a glance
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleModal}
              className="group flex items-center gap-2 px-5 py-3 rounded-xl bg-[#7C3AED] text-white text-sm font-medium hover:bg-[#6D28D9] transition-all hover:shadow-lg hover:shadow-[#7C3AED]/25"
            >
              <span>+ Add Application</span>
            </button>
            <button
              onClick={() => navigate("/applications")}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-[#DDD6FE] text-sm font-medium text-[#1E1B4B] hover:bg-[#DDD6FE]/50 transition-all"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="group relative bg-white rounded-2xl border border-[#DDD6FE]/50 p-6 hover:border-[#7C3AED]/30 transition-all hover:shadow-lg hover:shadow-[#7C3AED]/5 overflow-hidden"
            >
              {/* Gradient accent */}
              <div
                className={`absolute top-0 right-0 w-24 h-24 bg-linear-to-br ${stat.gradient} opacity-10 rounded-full blur-2xl -translate-y-8 translate-x-8 group-hover:opacity-20 transition-opacity`}
              />

              <div className="relative">
                <div
                  className={`w-10 h-10 rounded-xl bg-linear-to-br ${stat.gradient} flex items-center justify-center mb-4`}
                >
                  <stat.icon className="w-5 h-5 text-white" />
                </div>

                <p className="text-sm text-[#1E1B4B]/60 mb-1">{stat.label}</p>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-bold text-[#1E1B4B]">
                    {loading ? (
                      <span className="inline-block w-8 h-8 rounded bg-[#DDD6FE]/50 animate-pulse" />
                    ) : (
                      stat.value
                    )}
                  </p>
                  <span className="text-xs text-[#1E1B4B]/40">
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
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#DDD6FE]/50 overflow-hidden">
            <div className="p-6 border-b border-[#DDD6FE]/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#7C3AED]/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-[#7C3AED]" />
                  </div>
                  <h2 className="text-lg font-semibold text-[#1E1B4B]">
                    Recent Applications
                  </h2>
                </div>
                <button
                  onClick={() => navigate("/applications")}
                  className="text-sm text-[#7C3AED] hover:text-[#6D28D9] font-medium flex items-center gap-1"
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
                      className="flex items-center justify-between p-4 rounded-xl bg-[#FAFAFF] animate-pulse"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#DDD6FE]/50" />
                        <div className="space-y-2">
                          <div className="w-32 h-4 rounded bg-[#DDD6FE]/50" />
                          <div className="w-24 h-3 rounded bg-[#DDD6FE]/30" />
                        </div>
                      </div>
                      <div className="w-20 h-6 rounded-full bg-[#DDD6FE]/50" />
                    </div>
                  ))}
                </div>
              ) : applications.length > 0 ? (
                <div className="space-y-3">
                  {applications.slice(0, 5).map((app, index) => {
                    const statusData = getStatusConfig(app.status);
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 rounded-xl bg-[#FAFAFF] hover:bg-[#DDD6FE]/20 transition-colors cursor-pointer group"
                        onClick={() => navigate("/applications")}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#7C3AED] to-[#A78BFA] flex items-center justify-center text-white font-semibold text-sm">
                            {app.company_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-[#1E1B4B] group-hover:text-[#7C3AED] transition-colors">
                              {app.company_name}
                            </p>
                            <p className="text-sm text-[#1E1B4B]/50">
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
                  <div className="w-16 h-16 rounded-2xl bg-[#DDD6FE]/30 flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-8 h-8 text-[#7C3AED]/50" />
                  </div>
                  <p className="text-[#1E1B4B]/70 font-medium">
                    No applications yet
                  </p>
                  <p className="text-sm text-[#1E1B4B]/40 mt-1">
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
              className="bg-linear-to-br from-[#1E1B4B] to-[#2D2A5B] rounded-2xl p-6 text-white relative overflow-hidden cursor-pointer hover:shadow-lg hover:shadow-[#7C3AED]/20 transition-all group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#38BDF8] opacity-20 rounded-full blur-3xl group-hover:opacity-30 transition-opacity" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#7C3AED] opacity-20 rounded-full blur-2xl group-hover:opacity-30 transition-opacity" />

              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-[#38BDF8]" />
                  <span className="text-sm font-medium text-[#38BDF8]">
                    AI-Powered Journal
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                    Active
                  </span>
                </div>

                <p className="text-white/80 text-sm leading-relaxed mb-3">
                  Enhance your journal entries with AI. Improve writing, expand
                  ideas, and get smart tag suggestions.
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
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Powered by Gemini AI
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/50 group-hover:text-white/80 transition-colors" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl border border-[#DDD6FE]/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#38BDF8]/10 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-[#38BDF8]" />
                </div>
                <h2 className="text-lg font-semibold text-[#1E1B4B]">
                  Journal Stats
                </h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAFAFF]">
                  <span className="text-sm text-[#1E1B4B]/60">
                    Total Entries
                  </span>
                  <span className="font-semibold text-[#1E1B4B]">
                    {entries.length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAFAFF]">
                  <span className="text-sm text-[#1E1B4B]/60">
                    Hours Logged
                  </span>
                  <span className="font-semibold text-[#1E1B4B]">
                    {totalHoursLogged.toFixed(1)}h
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate("/logs")}
                className="w-full mt-4 py-3 rounded-xl border border-[#DDD6FE] text-sm font-medium text-[#7C3AED] hover:bg-[#DDD6FE]/30 transition-colors flex items-center justify-center gap-2"
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
  );
}
