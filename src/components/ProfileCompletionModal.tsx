import { Dialog, DialogContent, IconButton } from "@mui/material";
import { GraduationCap, X } from "lucide-react";
import { useEffect, useState } from "react";
import SchoolFields, { type AcademicInfo } from "@/components/SchoolFields";
import { useProfileStore } from "@/store/profileStore";
import { DEFAULT_REQUIRED_HOURS } from "@/lib/academicPresets";

interface ProfileCompletionModalProps {
  open: boolean;
  onClose: () => void;
  initial?: Partial<AcademicInfo> & {
    nickname?: string | null;
    required_hours?: number | null;
  };
}

/**
 * Prompts existing users who registered before academic info was collected to
 * fill in their school/course/program. Dismissible; re-prompts next login until
 * a school is saved (gate lives in Layout).
 */
export default function ProfileCompletionModal({
  open,
  onClose,
  initial,
}: ProfileCompletionModalProps) {
  const { updateProfile, loading } = useProfileStore();
  const [academic, setAcademic] = useState<AcademicInfo>({
    school: initial?.school ?? "",
    school_id: initial?.school_id ?? null,
    course: initial?.course ?? "",
    program: initial?.program ?? "",
  });
  const [nickname, setNickname] = useState(initial?.nickname ?? "");
  const [requiredHours, setRequiredHours] = useState(
    initial?.required_hours ?? DEFAULT_REQUIRED_HOURS,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      setNickname(initial?.nickname ?? "");
      setAcademic({
        school: initial?.school ?? "",
        school_id: initial?.school_id ?? null,
        course: initial?.course ?? "",
        program: initial?.program ?? "",
      });
      setRequiredHours(initial?.required_hours ?? DEFAULT_REQUIRED_HOURS);
      setError(null);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [
    initial?.course,
    initial?.nickname,
    initial?.program,
    initial?.required_hours,
    initial?.school,
    initial?.school_id,
    open,
  ]);

  const handleSave = async () => {
    if (!academic.school.trim()) {
      setError("Please enter your school or university.");
      return;
    }
    if (!academic.course.trim()) {
      setError("Please enter your course.");
      return;
    }
    if (requiredHours < 1) {
      setError("Required hours must be at least 1.");
      return;
    }
    setError(null);
    const result = await updateProfile({
      nickname: nickname || null,
      school: academic.school || null,
      school_id: academic.school_id,
      course: academic.course || null,
      program: academic.program || null,
      required_hours: requiredHours,
    });
    if (result) onClose();
    else setError("Could not save your details. Please try again.");
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}
    >
      <IconButton
        onClick={onClose}
        sx={{ position: "absolute", right: 8, top: 8, color: "grey.500" }}
      >
        <X size={20} />
      </IconButton>

      <DialogContent sx={{ p: 4 }}>
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <GraduationCap className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-text">
            Complete your profile
          </h2>
          <p className="text-sm text-text-muted mt-1.5 max-w-sm">
            Tell us where you study so we can personalize your reports,
            certificate, and leaderboards.
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-text mb-2">
            Nickname
          </label>
          <input
            type="text"
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-canvas text-text text-sm placeholder:text-text-subtle focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            placeholder="e.g. kole"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
          <p className="mt-1.5 text-xs text-text-muted">
            Used in greetings, sidebar, and leaderboards.
          </p>
        </div>

        <SchoolFields value={academic} onChange={setAcademic} />

        <div className="mt-4">
          <label className="block text-sm font-medium text-text mb-2">
            Required Hours
          </label>
          <input
            type="number"
            min={1}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-canvas text-text text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            value={requiredHours}
            onChange={(e) => setRequiredHours(Number(e.target.value) || 0)}
          />
        </div>

        {error && (
          <p className="mt-4 text-sm text-error text-center">{error}</p>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-text-muted hover:bg-surface transition-colors"
          >
            Later
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
