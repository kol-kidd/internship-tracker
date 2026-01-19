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
  viewApplication: (appId: number) => void;
  editApplication: (
    appId: number,
    companyName: string,
    companyAddress: string,
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
        return { bg: "#EFF6FF", text: "#1E40AF", border: "#BFDBFE" };
      case "interviewing":
        return { bg: "#F3E8FF", text: "#6B21A8", border: "#D8B4FE" };
      case "offer received":
        return { bg: "#D1FAE5", text: "#065F46", border: "#A7F3D0" };
      case "rejected":
        return { bg: "#FEE2E2", text: "#991B1B", border: "#FECACA" };
      case "accepted":
        return { bg: "#D1FAE5", text: "#065F46", border: "#6EE7B7" };
      case "withdrawn":
        return { bg: "#F3F4F6", text: "#374151", border: "#D1D5DB" };
      default:
        return { bg: "#EFF6FF", text: "#1E40AF", border: "#BFDBFE" };
    }
  };

  const chipColors = getChipColor(props.status);

  return (
    <div
      key={props.id}
      className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {props.company_name}
            </h3>
          </div>
          {props.position && (
            <p className="text-sm text-gray-600 mb-2">{props.position}</p>
          )}
        </div>
        <LongMenu
          currentStatus={props.status}
          onStatusChange={(newStatus) =>
            props.updateStatus(props.id, newStatus)
          }
        />
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="truncate">{props.company_address}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4 text-gray-400" />
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
              )
            }
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() =>
              props.deleteApplication(props.id, props.company_name)
            }
            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>

      {/* Notes Preview */}
      {props.notes && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 line-clamp-2">{props.notes}</p>
        </div>
      )}
    </div>
  );
}
