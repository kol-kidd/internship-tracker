import { useDroppable } from "@dnd-kit/core";
import type { Application } from "@/store/applicationStore";
import type { KanbanColumnId } from "@/lib/kanban";
import { COLUMN_LABELS, COLUMN_COLORS, COLUMN_EMPTY_HINTS } from "@/lib/kanban";
import KanbanCard from "./KanbanCard";
import LongMenu from "./LongMenu";

type KanbanColumnProps = {
  columnId: KanbanColumnId;
  applications: Application[];
  onEdit: (
    id: number,
    name: string,
    address: string,
    position?: string,
    stipend?: "paid" | "unpaid"
  ) => void;
  onDelete: (id: number, name: string) => void;
  onStatusChange: (id: number, status: string) => void;
  winnerId?: number | null;
};

export default function KanbanColumn({
  columnId,
  applications,
  onEdit,
  onDelete,
  onStatusChange,
  winnerId,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId });
  const colors = COLUMN_COLORS[columnId];
  const label = COLUMN_LABELS[columnId];
  const emptyHint = COLUMN_EMPTY_HINTS[columnId];

  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-col rounded-xl border-2 min-h-[280px] transition-colors
        ${colors.bg} ${colors.border}
        ${isOver ? "ring-2 ring-primary/40 ring-offset-2" : ""}
      `}
    >
      <div
        className={`flex items-center justify-between px-4 py-3 rounded-t-lg ${colors.header} text-white`}
      >
        <span className="font-semibold text-sm">{label}</span>
        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
          {applications.length}
        </span>
      </div>

      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
        {applications.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-6 px-2">
            {emptyHint}
          </p>
        ) : (
          applications.map((app) => (
            <KanbanCard
              key={app.id}
              app={app}
              isWinner={winnerId != null && app.id === winnerId}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              renderStatusMenu={(app) => (
                <LongMenu
                  currentStatus={app.status}
                  onStatusChange={(newStatus) =>
                    onStatusChange(app.id, newStatus)
                  }
                />
              )}
            />
          ))
        )}
      </div>
    </div>
  );
}
