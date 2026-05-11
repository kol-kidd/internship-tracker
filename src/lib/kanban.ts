export const KANBAN_COLUMN_IDS = [
  "applied",
  "interviewing",
  "offer",
  "accepted",
] as const;

export type KanbanColumnId = (typeof KANBAN_COLUMN_IDS)[number];

export const COLUMN_LABELS: Record<KanbanColumnId, string> = {
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer Received",
  accepted: "Accepted",
};

export const COLUMN_COLORS: Record<
  KanbanColumnId,
  { bg: string; border: string; header: string }
> = {
  applied: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    header: "bg-blue-500",
  },
  interviewing: {
    bg: "bg-sky-50",
    border: "border-sky-200",
    header: "bg-sky-600",
  },
  offer: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    header: "bg-orange-500",
  },
  accepted: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    header: "bg-emerald-500",
  },
};

export const COLUMN_EMPTY_HINTS: Record<KanbanColumnId, string> = {
  applied: "Add an application to get started",
  interviewing:
    "Move a card here once an interview is scheduled.",
  offer: "Offers will appear here when you receive them",
  accepted: "Move accepted offers here.",
};

export function statusToColumnId(status: string): KanbanColumnId {
  const s = status.toLowerCase();
  if (KANBAN_COLUMN_IDS.includes(s as KanbanColumnId)) return s as KanbanColumnId;
  return "applied";
}

export function isActiveColumnId(id: string): id is KanbanColumnId {
  return KANBAN_COLUMN_IDS.includes(id as KanbanColumnId);
}
