import { useState, useEffect, useMemo } from "react";
import { Calendar, FileText, MapPin } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import type { Application } from "@/store/applicationStore";
import { getJourneySummary } from "@/functions/ai/journalAI";

const STATUS_LABELS: Record<string, string> = {
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer Received",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function appliedDaysAgo(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function timelineTag(dateStr: string): string {
  const days = appliedDaysAgo(dateStr);
  if (days === 0) return "Applied today";
  if (days === 1) return "Applied 1 day ago";
  return `Applied ${days} days ago`;
}

function statusStyles(status: string): string {
  const s = status.toLowerCase();
  switch (s) {
    case "applied":
      return "bg-blue-500/10 text-blue-700 border-blue-200";
    case "interviewing":
      return "bg-info/10 text-info border-info/20";
    case "offer":
      return "bg-orange-500/10 text-orange-700 border-orange-200";
    case "accepted":
      return "bg-emerald-500/10 text-emerald-700 border-emerald-200";
    case "rejected":
      return "bg-red-500/10 text-red-700 border-red-200";
    case "withdrawn":
      return "bg-gray-500/10 text-gray-600 border-gray-200";
    default:
      return "bg-gray-500/10 text-gray-600 border-gray-200";
  }
}

type JourneyTimelineProps = {
  applications: Application[];
};

type JourneySummaryInput = {
  date_applied: string;
  company_name: string;
  position?: string;
  status: string;
};

type NarrativeState = {
  key: string;
  narrative: string | null;
  error: boolean;
};

export default function JourneyTimeline({
  applications,
}: JourneyTimelineProps) {
  const { session } = useAuthStore();
  const accessToken = session?.access_token;
  const sessionUserId = session?.user.id;
  const [narrativeState, setNarrativeState] = useState<NarrativeState>({
    key: "",
    narrative: null,
    error: false,
  });

  const timelineEvents = useMemo(() => {
    return [...applications].sort(
      (a, b) =>
        new Date(a.date_applied).getTime() - new Date(b.date_applied).getTime()
    );
  }, [applications]);

  const summaryInput = useMemo<JourneySummaryInput[]>(
    () =>
      applications.map((a) => ({
        date_applied: a.date_applied,
        company_name: a.company_name,
        position: a.position,
        status: a.status,
      })),
    [applications]
  );

  const narrativeKey = useMemo(() => {
    if (!accessToken || !sessionUserId || applications.length === 0) return "";
    return `${sessionUserId}:${JSON.stringify(summaryInput)}`;
  }, [accessToken, applications.length, sessionUserId, summaryInput]);

  useEffect(() => {
    if (!accessToken || !narrativeKey) return;

    let cancelled = false;

    getJourneySummary(summaryInput, accessToken)
      .then((summary) => {
        if (!cancelled) {
          setNarrativeState({
            key: narrativeKey,
            narrative: summary,
            error: false,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNarrativeState({
            key: narrativeKey,
            narrative: null,
            error: true,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, narrativeKey, summaryInput]);

  const hasNarrativeRequest = narrativeKey !== "";
  const narrativeLoading =
    hasNarrativeRequest && narrativeState.key !== narrativeKey;
  const narrativeError =
    hasNarrativeRequest &&
    narrativeState.key === narrativeKey &&
    narrativeState.error;
  const narrative =
    hasNarrativeRequest && narrativeState.key === narrativeKey
      ? narrativeState.narrative
      : null;

  if (applications.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-canvas p-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-7 h-7 text-primary" />
        </div>
        <p className="text-text font-semibold">No applications yet</p>
        <p className="text-sm text-text-muted mt-1">
          Add applications to see your timeline.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <section
        className={`rounded-2xl border p-5 transition-colors ${
          narrativeLoading
            ? "border-primary/30 bg-primary/5"
            : narrative
            ? "border-primary/20 bg-primary/5"
            : narrativeError
            ? "border-border bg-canvas"
            : "border-border bg-canvas"
        }`}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-base font-semibold text-text">
            Application summary
          </h2>
        </div>
        {narrativeLoading && (
          <div className="flex items-center gap-3 text-text-muted py-2">
            <span className="inline-block w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-sm">Building summary...</span>
          </div>
        )}
        {narrativeError && (
          <p className="text-sm text-text-muted">
            We couldn't generate a summary right now. Your timeline is below.
          </p>
        )}
        {!narrativeLoading && narrative && (
          <p className="text-sm text-text leading-relaxed tracking-tight">
            {narrative}
          </p>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
          Timeline
        </h2>
        <div className="relative pl-8">
          <div
            className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-border rounded-full"
            aria-hidden
          />
          <ul className="space-y-4">
            {timelineEvents.map((app) => (
              <li key={app.id} className="relative flex gap-4">
                <div
                  className="absolute left-[4px] top-2.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-canvas shadow-sm z-10"
                  aria-hidden
                />
                <div className="flex-1 min-w-0 rounded-xl border border-border bg-canvas p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-text">
                        {app.company_name}
                      </p>
                      {app.position && (
                        <p className="text-sm font-medium text-text-muted mt-0.5">
                          {app.position}
                        </p>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium shrink-0 ${statusStyles(
                        app.status
                      )}`}
                    >
                      {STATUS_LABELS[app.status.toLowerCase()] ?? app.status}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {(app.stipend === "paid" || app.stipend === "unpaid") && (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          app.stipend === "paid"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {app.stipend === "paid" ? "Paid" : "Unpaid"}
                      </span>
                    )}
                    <span className="text-xs text-text-muted">
                      {timelineTag(app.date_applied)}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-text-muted">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      {formatDate(app.date_applied)}
                    </span>
                    {app.company_address && (
                      <span className="flex items-center gap-1.5 truncate max-w-[200px]">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{app.company_address}</span>
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
