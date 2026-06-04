import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileText,
} from "lucide-react";
import type {
  ReadinessTarget,
  ReportReadinessSummary,
} from "@/lib/reportReadiness";

type ReportReadinessPanelProps = {
  readiness: ReportReadinessSummary;
  variant?: "compact" | "full";
  onAction: (target: ReadinessTarget) => void;
};

export default function ReportReadinessPanel({
  readiness,
  variant = "full",
  onAction,
}: ReportReadinessPanelProps) {
  const compact = variant === "compact";
  const issuesToShow = compact
    ? readiness.issues.slice(0, 3)
    : readiness.issues;

  return (
    <section className={compact ? "app-panel p-5" : "app-panel p-5 sm:p-6"}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              readiness.isReady
                ? "bg-success/10 text-success"
                : "bg-warning/10 text-warning"
            }`}
          >
            {readiness.isReady ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <ClipboardCheck className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
              Report Readiness
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-text">
              {readiness.headline}
            </h2>
            <p className="mt-1 text-sm leading-6 text-text-muted">
              {readiness.description}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onAction(readiness.isReady ? "reports" : readiness.issues[0]?.target ?? "entries")}
          className={`inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
            readiness.isReady
              ? "bg-primary text-white hover:bg-primary-hover"
              : "border border-border bg-canvas text-text hover:bg-surface"
          }`}
        >
          {readiness.isReady ? "Open Reports" : "Fix next"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-surface p-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">
            Ready
          </p>
          <p className="mt-1 text-lg font-semibold text-text">
            {readiness.readyEntries}/{readiness.totalEntries}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">
            Evidence
          </p>
          <p className="mt-1 text-lg font-semibold text-text">
            {readiness.totalEvidence}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">
            Issues
          </p>
          <p className="mt-1 text-lg font-semibold text-text">
            {readiness.issues.length}
          </p>
        </div>
      </div>

      {issuesToShow.length > 0 ? (
        <div className="mt-4 space-y-2">
          {issuesToShow.map((issue) => (
            <button
              key={issue.key}
              type="button"
              onClick={() => onAction(issue.target)}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface px-3 py-2.5 text-left transition-colors hover:border-primary/25 hover:bg-canvas"
            >
              <span className="flex min-w-0 items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-text">
                    {issue.label}
                  </span>
                  {!compact && (
                    <span className="block truncate text-xs text-text-muted">
                      {issue.message}
                    </span>
                  )}
                </span>
              </span>
              <span className="shrink-0 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-bold text-warning">
                {issue.count || 1}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-success/20 bg-success/10 px-3 py-2 text-sm font-semibold text-success">
          <FileText className="h-4 w-4" />
          School-ready exports can be generated from Reports.
        </div>
      )}
    </section>
  );
}
