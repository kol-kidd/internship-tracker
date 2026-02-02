import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Building2, MapPin, Edit2, Trash2 } from "lucide-react";
import type { Application } from "@/store/applicationStore";

function daysSince(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function formatTimeline(dateStr: string): string {
  const days = daysSince(dateStr);
  if (days === 0) return "Applied today";
  if (days === 1) return "Applied 1 day ago";
  return `Applied ${days} days ago`;
}

type KanbanCardProps = {
  app: Application;
  isWinner?: boolean;
  onEdit: (
    id: number,
    name: string,
    address: string,
    position?: string,
    stipend?: "paid" | "unpaid"
  ) => void;
  onDelete: (id: number, name: string) => void;
  onStatusChange: (id: number, status: string) => void;
  renderStatusMenu: (app: Application) => React.ReactNode;
};

export default function KanbanCard({
  app,
  isWinner,
  onEdit,
  onDelete,
  renderStatusMenu,
}: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `app-${app.id}`,
      data: { app },
    });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  const stipendLabel =
    app.stipend === "paid"
      ? "Paid"
      : app.stipend === "unpaid"
      ? "Unpaid"
      : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        rounded-xl border bg-canvas p-4 shadow-sm transition-shadow
        ${
          isWinner
            ? "border-amber-400 border-2 ring-2 ring-amber-200"
            : "border-border"
        }
        ${isDragging ? "opacity-90 shadow-md z-50" : "hover:shadow-md"}
      `}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <Building2 className="w-4 h-4 text-text-muted shrink-0" />
            <span className="font-semibold text-text truncate">
              {app.company_name}
            </span>
          </div>
          {app.position && (
            <p className="text-sm font-medium text-text-muted truncate">
              {app.position}
            </p>
          )}
        </div>
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          {renderStatusMenu(app)}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-2">
        {stipendLabel && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              app.stipend === "paid"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {stipendLabel}
          </span>
        )}
        <span className="text-xs text-text-muted">
          {formatTimeline(app.date_applied)}
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm text-text-muted mb-3">
        <MapPin className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{app.company_address}</span>
      </div>

      <div className="flex items-center justify-end gap-1 pt-2 border-t border-border">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(
              app.id,
              app.company_name,
              app.company_address,
              app.position,
              app.stipend
            );
          }}
          className="p-1.5 rounded-lg text-text-muted hover:bg-surface-alt hover:text-text transition-colors"
          aria-label="Edit application"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(app.id, app.company_name);
          }}
          className="p-1.5 rounded-lg text-text-muted hover:bg-pastel-pink hover:text-red-600 transition-colors"
          aria-label="Delete application"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {isWinner && (
        <div className="mt-3 pt-3 border-t border-amber-200/60">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded-lg">
            Goal Achieved
          </span>
        </div>
      )}
    </div>
  );
}
