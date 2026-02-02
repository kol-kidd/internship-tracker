import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  KANBAN_COLUMN_IDS,
  statusToColumnId,
  isActiveColumnId,
} from "@/lib/kanban";
import KanbanColumn from "./KanbanColumn";
import type { Application } from "@/store/applicationStore";
import { triggerConfetti } from "@/lib/confetti";

const ONBOARDING_COLUMN_IDS = ["offer", "accepted"] as const;

type KanbanBoardProps = {
  applications: Application[];
  onStatusChange: (id: number, status: string) => Promise<void>;
  onEdit: (
    id: number,
    name: string,
    address: string,
    position?: string,
    stipend?: "paid" | "unpaid"
  ) => void;
  onDelete: (id: number, name: string) => void;
  onboardingMode?: boolean;
};

function appsByColumn(applications: Application[]) {
  const byColumn: Record<string, Application[]> = {};
  KANBAN_COLUMN_IDS.forEach((id) => {
    byColumn[id] = applications.filter(
      (app) => statusToColumnId(app.status) === id
    );
  });
  const rejectedOrWithdrawn = applications.filter(
    (app) =>
      app.status.toLowerCase() === "rejected" ||
      app.status.toLowerCase() === "withdrawn"
  );
  return { byColumn, rejectedOrWithdrawn };
}

export default function KanbanBoard({
  applications,
  onStatusChange,
  onEdit,
  onDelete,
  onboardingMode = false,
}: KanbanBoardProps) {
  const columnIds = onboardingMode
    ? [...ONBOARDING_COLUMN_IDS]
    : [...KANBAN_COLUMN_IDS];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const { byColumn } = appsByColumn(applications);
  const acceptedApp = applications.find(
    (a) => a.status.toLowerCase() === "accepted"
  );
  const winnerId = acceptedApp?.id ?? null;

  const resolveTargetStatus = (overId: string): string | null => {
    if (isActiveColumnId(overId)) return overId;
    if (String(overId).startsWith("app-")) {
      const targetAppId = Number(String(overId).replace("app-", ""));
      const targetApp = applications.find((a) => a.id === targetAppId);
      return targetApp ? statusToColumnId(targetApp.status) : null;
    }
    return null;
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over?.id) return;
    const overId = String(over.id);
    const newStatus = resolveTargetStatus(overId);
    if (!newStatus) return;
    if (!active.id.toString().startsWith("app-")) return;
    const appId = Number(active.id.toString().replace("app-", ""));
    const app = applications.find((a) => a.id === appId);
    if (!app) return;
    const currentStatus = app.status.toLowerCase();
    if (currentStatus === newStatus) return;

    const wasAccepted = newStatus === "accepted";
    await onStatusChange(appId, newStatus);
    if (wasAccepted) triggerConfetti();
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div
        className={`grid grid-cols-1 gap-4 ${
          onboardingMode ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-4"
        }`}
      >
        {columnIds.map((columnId) => (
          <KanbanColumn
            key={columnId}
            columnId={columnId}
            applications={byColumn[columnId] ?? []}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={(id, status) => onStatusChange(id, status)}
            winnerId={winnerId}
          />
        ))}
      </div>
    </DndContext>
  );
}
