import { Briefcase, MessageSquare, Calendar } from "lucide-react";

type JourneyStatCardProps = {
  totalApplied: number;
  totalInterviewing: number;
  daysToAccept: number;
};

export default function JourneyStatCard({
  totalApplied,
  totalInterviewing,
  daysToAccept,
}: JourneyStatCardProps) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-5">
      <p className="text-base font-semibold text-emerald-800 mb-3">
        Accepted application summary
      </p>
      <ul className="space-y-2 text-sm text-emerald-700">
        <li className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-emerald-600 shrink-0" />
          You applied to <strong>{totalApplied}</strong> companies
        </li>
        <li className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
          Interviewed with <strong>{totalInterviewing}</strong>
        </li>
        <li className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
          Landed a role in <strong>{daysToAccept}</strong> days
        </li>
      </ul>
    </div>
  );
}
