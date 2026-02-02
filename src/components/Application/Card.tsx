import { Building2, Calendar, Edit2, MapPin, Trash2 } from "lucide-react";
import LongMenu from "./LongMenu";
import { Chip } from "@mui/material";

interface StatusConfig {
  color: string;
  label: string;
}

type CardProps = {
  id: number;
  company_name: string;
  company_address: string;
  position: string | undefined;
  date_applied: string;
  status: string;
  notes: string | undefined;
  stipend?: "paid" | "unpaid";
  viewApplication: (appId: number) => void;
  editApplication: (
    appId: number,
    companyName: string,
    companyAddress: string,
    position?: string,
    stipend?: "paid" | "unpaid"
  ) => void;
  updateStatus: (appId: number, newStatus: string) => void;
  deleteApplication: (appId: number, companyName: string) => void;
  getStatusConfig: (status: string) => StatusConfig;
};

export default function Card(props: CardProps) {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getChipColor = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case "applied":
        return { bg: "#d0e0e6", text: "#4a6a75", border: "#b8d0d8" };
      case "interviewing":
        return { bg: "#e6e0f0", text: "#5a5070", border: "#d0c8e0" };
      case "offer":
        return { bg: "#d4edda", text: "#2d5a36", border: "#b8ddc4" };
      case "rejected":
        return { bg: "#f4d8d8", text: "#8b4a4a", border: "#e8c4c4" };
      case "accepted":
        return { bg: "#d4edda", text: "#2d5a36", border: "#a7d4b4" };
      case "withdrawn":
        return { bg: "#e8e4df", text: "#4a4540", border: "#d0cbc4" };
      default:
        return { bg: "#d0e0e6", text: "#4a6a75", border: "#b8d0d8" };
    }
  };

  const chipColors = getChipColor(props.status);

  return (
    <div
      key={props.id}
      className="bg-canvas rounded-xl border border-border p-6 hover:shadow-sm transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-5 h-5 text-text-muted flex-shrink-0" />
            <h3 className="text-lg font-semibold text-text truncate">
              {props.company_name}
            </h3>
          </div>
          {props.position && (
            <p className="text-sm text-text-muted mb-2 truncate">
              {props.position}
            </p>
          )}
        </div>
        <div className="flex-shrink-0">
          <LongMenu
            currentStatus={props.status}
            onStatusChange={(newStatus) =>
              props.updateStatus(props.id, newStatus)
            }
          />
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <MapPin className="w-4 h-4 text-text-muted flex-shrink-0" />
          <span className="truncate">{props.company_address}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <Calendar className="w-4 h-4 text-text-muted flex-shrink-0" />
          <span>Applied {formatDate(props.date_applied)}</span>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <Chip
          label={props.getStatusConfig(props.status).label}
          size="small"
          sx={{
            backgroundColor: chipColors.bg,
            color: chipColors.text,
            border: `1px solid ${chipColors.border}`,
            fontWeight: 500,
            fontSize: "0.75rem",
            height: "28px",
            "& .MuiChip-label": {
              px: 1.5,
            },
          }}
        />

        <div className="flex items-center gap-1">
          {/* <button
            onClick={() => props.viewApplication(props.id)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4 text-gray-600" />
          </button> */}
          <button
            onClick={() =>
              props.editApplication(
                props.id,
                props.company_name,
                props.company_address,
                props.position,
                props.stipend
              )
            }
            className="p-1.5 hover:bg-surface-alt rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4 text-text-muted" />
          </button>
          <button
            onClick={() =>
              props.deleteApplication(props.id, props.company_name)
            }
            className="p-1.5 hover:bg-pastel-pink rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>

      {/* Notes Preview */}
      {props.notes && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-text-muted line-clamp-2">{props.notes}</p>
        </div>
      )}
    </div>
  );
}
