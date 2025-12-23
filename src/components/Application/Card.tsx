import {
  Building2,
  Calendar,
  Edit2,
  Eye,
  MapPin,
  MoreVertical,
  Trash2,
} from "lucide-react";

interface StatusConfig {
  color: string;
  label: string;
}

type CardProps = {
  id: string;
  company_name: string;
  company_address: string;
  position: string | undefined;
  date_applied: string;
  status: string;
  notes: string | undefined;
  viewApplication: (appId: string) => void;
  editApplication: (appId: string) => void;
  deleteApplication: (appId: string) => void;
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
        <button className="p-1 hover:bg-gray-100 rounded">
          <MoreVertical className="w-5 h-5 text-gray-400" />
        </button>
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
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium border ${
            props.getStatusConfig(props.status).color
          }`}
        >
          {props.getStatusConfig(props.status).label}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => props.viewApplication(props.id)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => props.editApplication(props.id)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => props.deleteApplication(props.id)}
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
