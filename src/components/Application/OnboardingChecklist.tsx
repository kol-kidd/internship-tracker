import { useEffect, useState } from "react";
import { Check, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useAppStore } from "@/store/applicationStore";

type OnboardingChecklistProps = {
  applicationId: number;
};

export default function OnboardingChecklist({
  applicationId,
}: OnboardingChecklistProps) {
  const [newLabel, setNewLabel] = useState("");
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const items =
    useAppStore((state) => state.checklistsByApplicationId[applicationId]) ?? [];
  const loading = Boolean(
    useAppStore((state) => state.checklistLoadingByApplicationId[applicationId]),
  );
  const fetchChecklist = useAppStore((state) => state.fetchChecklist);
  const addChecklistItem = useAppStore((state) => state.addChecklistItem);
  const updateChecklistItem = useAppStore((state) => state.updateChecklistItem);
  const deleteChecklistItem = useAppStore((state) => state.deleteChecklistItem);

  useEffect(() => {
    void fetchChecklist(applicationId);
  }, [applicationId, fetchChecklist]);

  const completedCount = items.filter((item) => item.completed).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  const handleAdd = async () => {
    const label = newLabel.trim();
    if (!label) return;

    setSaving(true);
    try {
      await addChecklistItem(applicationId, label);
      setNewLabel("");
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (itemId: number, label: string) => {
    setEditingItemId(itemId);
    setEditingLabel(label);
  };

  const cancelEditing = () => {
    setEditingItemId(null);
    setEditingLabel("");
  };

  const handleSaveEdit = async () => {
    if (editingItemId == null) return;
    const label = editingLabel.trim();
    if (!label) return;

    setSaving(true);
    try {
      await updateChecklistItem(applicationId, editingItemId, { label });
      cancelEditing();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 border-t border-border pt-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Onboarding
          </p>
          <p className="mt-1 text-sm font-semibold text-text">
            {completedCount}/{items.length || 0} tasks complete
          </p>
        </div>
        <div className="h-2 w-24 overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {loading && items.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-3 text-sm text-text-muted">
          Loading checklist...
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <div className="group flex items-center gap-2 rounded-xl border border-border-subtle bg-surface px-3 py-2">
                <button
                  type="button"
                  onClick={() =>
                    updateChecklistItem(applicationId, item.id, {
                      completed: !item.completed,
                    })
                  }
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                    item.completed
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-canvas text-transparent hover:border-primary"
                  }`}
                  aria-label={
                    item.completed ? "Mark incomplete" : "Mark complete"
                  }
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                {editingItemId === item.id ? (
                  <>
                    <input
                      value={editingLabel}
                      onChange={(event) => setEditingLabel(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") void handleSaveEdit();
                        if (event.key === "Escape") cancelEditing();
                      }}
                      className="min-w-0 flex-1 rounded-lg border border-border bg-canvas px-2 py-1.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={saving || !editingLabel.trim()}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-success transition-colors hover:bg-success/10 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Save checklist task"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-subtle transition-colors hover:bg-border"
                      aria-label="Cancel editing checklist task"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <span
                      className={`min-w-0 flex-1 truncate text-sm ${
                        item.completed
                          ? "text-text-muted line-through"
                          : "text-text"
                      }`}
                    >
                      {item.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => startEditing(item.id, item.label)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-subtle opacity-100 transition-colors hover:bg-primary/10 hover:text-primary sm:opacity-0 sm:group-hover:opacity-100"
                      aria-label={`Edit ${item.label}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteChecklistItem(applicationId, item.id)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-subtle opacity-100 transition-colors hover:bg-error/10 hover:text-error sm:opacity-0 sm:group-hover:opacity-100"
                      aria-label={`Delete ${item.label}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex gap-2">
        <input
          value={newLabel}
          onChange={(event) => setNewLabel(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void handleAdd();
          }}
          placeholder="Add onboarding task"
          className="min-w-0 flex-1 rounded-xl border border-border bg-canvas px-3 py-2 text-sm text-text placeholder:text-text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={saving || !newLabel.trim()}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Add checklist task"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
