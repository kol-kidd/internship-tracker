import { useState } from "react";
import { Check } from "lucide-react";

const CHECKLIST_KEYS = [
  "contract_signed",
  "documents_submitted",
  "equipment_received",
  "first_day_prep",
] as const;

const CHECKLIST_LABELS: Record<(typeof CHECKLIST_KEYS)[number], string> = {
  contract_signed: "Contract Signed",
  documents_submitted: "Documents Submitted",
  equipment_received: "Equipment Received",
  first_day_prep: "First Day Preparation",
};

const STORAGE_PREFIX = "onboarding_checklist_";

function getEmptyChecks(): Record<string, boolean> {
  return CHECKLIST_KEYS.reduce((acc, key) => {
    acc[key] = false;
    return acc;
  }, {} as Record<string, boolean>);
}

function getStored(appId: number): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${appId}`);
    if (!raw) return getEmptyChecks();
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return CHECKLIST_KEYS.reduce((acc, key) => {
      acc[key] = !!parsed[key];
      return acc;
    }, getEmptyChecks());
  } catch {
    return getEmptyChecks();
  }
}

function setStored(appId: number, state: Record<string, boolean>) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${appId}`, JSON.stringify(state));
  } catch {
    // ignore
  }
}

type OnboardingChecklistProps = {
  applicationId: number;
};

export default function OnboardingChecklist({
  applicationId,
}: OnboardingChecklistProps) {
  return (
    <OnboardingChecklistItems
      key={applicationId}
      applicationId={applicationId}
    />
  );
}

function OnboardingChecklistItems({ applicationId }: OnboardingChecklistProps) {
  const [checks, setChecks] = useState<Record<string, boolean>>(() =>
    getStored(applicationId)
  );

  const toggle = (key: (typeof CHECKLIST_KEYS)[number]) => {
    setChecks((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      setStored(applicationId, next);
      return next;
    });
  };

  return (
    <div className="mt-4 pt-4 border-t border-amber-200/60">
      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
        Onboarding
      </p>
      <ul className="space-y-2">
        {CHECKLIST_KEYS.map((key) => (
          <li key={key}>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={!!checks[key]}
                onChange={() => toggle(key)}
                className="rounded border-border text-amber-600 focus:ring-amber-500"
              />
              <span
                className={`text-sm ${
                  checks[key]
                    ? "text-text line-through"
                    : "text-text-muted group-hover:text-text"
                }`}
              >
                {CHECKLIST_LABELS[key]}
              </span>
              {checks[key] && (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
