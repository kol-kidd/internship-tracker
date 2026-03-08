import { Calendar, MapPin, Trash2, Edit3, MoreHorizontal } from "lucide-react";

interface CardProps {
  id: number;
  company_name: string;
  company_address: string;
  position?: string;
  date_applied: string;
  status: string;
  notes?: string;
  stipend?: "paid" | "unpaid";
  onDelete: () => void;
  onEdit: () => void;
  onStatusUpdate: (status: string) => void;
}

export default function Card({
  company_name,
  company_address,
  position,
  date_applied,
  status,
  notes,
  onDelete,
  onEdit,
}: CardProps) {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusStyles = (status: string) => {
    const s = status.toLowerCase();
    switch (s) {
      case "applied":
        return "bg-primary/5 text-primary";
      case "interviewing":
        return "bg-purple-500/5 text-[#af52de]";
      case "offer":
        return "bg-success/5 text-success";
      case "accepted":
        return "bg-success/10 text-success ring-1 ring-success/20";
      case "rejected":
        return "bg-error/5 text-error";
      default:
        return "bg-black/5 text-text-muted";
    }
  };

  return (
    <div className="group relative rounded-[2rem] glass border border-border/40 p-6 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
      <div className="flex justify-between items-start mb-6">
        <div
          className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusStyles(status)}`}
        >
          {status}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-2 rounded-xl text-text-muted hover:bg-black/5 hover:text-text transition-all"
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-xl text-error/60 hover:bg-error/5 hover:text-error transition-all"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-black text-text tracking-tight line-clamp-1">
            {company_name}
          </h3>
          <p className="text-sm font-bold text-text-muted">
            {position || "Internship Role"}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
            <MapPin size={14} className="opacity-40" />
            <span className="truncate">{company_address}</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
            <Calendar size={14} className="opacity-40" />
            <span>Applied {formatDate(date_applied)}</span>
          </div>
        </div>

        {notes && (
          <div className="pt-4 border-t border-border/30">
            <p className="text-xs font-medium text-text-muted leading-relaxed line-clamp-2 italic">
              "{notes}"
            </p>
          </div>
        )}
      </div>

      <button className="absolute bottom-6 right-6 p-2 rounded-xl bg-black/5 text-text-muted hover:bg-primary hover:text-white transition-all transform group-hover:scale-110">
        <MoreHorizontal size={18} />
      </button>
    </div>
  );
}
