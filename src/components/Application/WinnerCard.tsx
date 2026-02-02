import { Building2, Trophy } from "lucide-react";
import type { Application } from "@/store/applicationStore";

function daysUntil(startDateStr: string | undefined): number | null {
  if (!startDateStr) return null;
  const start = new Date(startDateStr);
  const now = new Date();
  start.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diff = start.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

type WinnerCardProps = {
  application: Application;
  daysUntilStart?: number | null;
};

export default function WinnerCard({
  application,
  daysUntilStart,
}: WinnerCardProps) {
  const days = daysUntilStart ?? daysUntil(application.start_date);

  return (
    <div className="rounded-2xl border-2 border-amber-400 bg-linear-to-br from-amber-50 to-canvas p-6 shadow-lg ring-2 ring-amber-200/60">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-amber-400 flex items-center justify-center shrink-0">
          <Trophy className="w-7 h-7 text-white" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded-lg mb-2">
            Goal Achieved
          </span>
          <h2 className="text-xl font-bold text-text truncate flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-600 shrink-0" />
            {application.company_name}
          </h2>
          {application.position && (
            <p className="text-text-muted font-medium mt-0.5">
              {application.position}
            </p>
          )}
          {days != null && (
            <p className="text-sm mt-2 font-medium text-amber-800">
              {days > 0
                ? `${days} day${days === 1 ? "" : "s"} until start date`
                : days === 0
                ? "Start date is today!"
                : "Start date has passed"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
