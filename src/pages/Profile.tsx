import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Award, Clock, Mail, Save, UserRound } from "lucide-react";
import SEO from "@/components/SEO";
import SchoolFields, { type AcademicInfo } from "@/components/SchoolFields";
import CertificateModal from "@/components/CertificateModal";
import type { CertificateData } from "@/components/Certificate";
import { useProfileStore } from "@/store/profileStore";
import { useAuthStore } from "@/store/authStore";
import { DEFAULT_REQUIRED_HOURS } from "@/lib/academicPresets";
import { getInitial, getProfileDisplayName } from "@/lib/profileIdentity";

export default function Profile() {
  const { user } = useAuthStore();
  const { profile, updateProfile, loading } = useProfileStore();

  const [academic, setAcademic] = useState<AcademicInfo>({
    school: "",
    school_id: null,
    course: "",
    program: "",
  });
  const [requiredHours, setRequiredHours] = useState<number>(
    DEFAULT_REQUIRED_HOURS,
  );
  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");
  const [saved, setSaved] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);

  useEffect(() => {
    if (!profile) return;

    const timer = window.setTimeout(() => {
      setFullName(profile.full_name ?? user?.user_metadata?.full_name ?? "");
      setNickname(profile.nickname ?? "");
      setAcademic({
        school: profile.school ?? "",
        school_id: profile.school_id ?? null,
        course: profile.course ?? "",
        program: profile.program ?? "",
      });
      setRequiredHours(profile.required_hours ?? DEFAULT_REQUIRED_HOURS);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [profile, user?.user_metadata?.full_name]);

  const { total, required, percent, completed } = useMemo(() => {
    const total = profile?.total_hours ?? 0;
    const required = profile?.required_hours ?? requiredHours;
    const percent = required > 0 ? Math.min(100, (total / required) * 100) : 0;
    return { total, required, percent, completed: !!profile?.hours_completed_at };
  }, [profile, requiredHours]);

  const handleSave = async () => {
    await updateProfile({
      full_name: fullName || null,
      nickname: nickname || null,
      school: academic.school || null,
      school_id: academic.school_id,
      course: academic.course || null,
      program: academic.program || null,
      required_hours: requiredHours,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const certificateName =
    profile?.full_name || user?.user_metadata?.full_name || "Intern";
  const displayName = getProfileDisplayName(profile, user?.user_metadata?.full_name);
  const initial = getInitial(displayName);
  const setupIncomplete = !profile?.school || !profile?.course;

  const certificateData: CertificateData = {
    name: certificateName,
    school: profile?.school ?? null,
    course: profile?.course ?? null,
    hours: profile?.required_hours ?? total,
    date: profile?.hours_completed_at ?? "",
  };

  return (
    <>
      <SEO title="Profile" description="Manage your InternPal profile and academic info." />

      <div className="max-w-3xl mx-auto space-y-6">
        {setupIncomplete && (
          <div className="bg-canvas rounded-xl border border-primary/20 p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text">
                Finish your academic profile
              </p>
              <p className="text-xs text-text-muted mt-1">
                School and course are needed for leaderboard grouping and your certificate details.
              </p>
            </div>
          </div>
        )}

        {/* Header card */}
        <div className="bg-canvas rounded-2xl border border-border p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
            {initial}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-text truncate">{displayName}</h1>
            <p className="text-sm text-text-muted flex items-center gap-1.5 mt-1">
              <Mail className="w-3.5 h-3.5" />
              {profile?.email || user?.email}
            </p>
          </div>
        </div>

        {/* Progress card */}
        <div className="bg-canvas rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Internship Progress
            </h2>
            {completed && (
              <span className="text-xs font-semibold text-success bg-success/10 px-2.5 py-1 rounded-full">
                Completed 🎉
              </span>
            )}
          </div>

          <div className="flex items-end justify-between mb-2">
            <span className="text-2xl font-bold text-text">
              {total.toFixed(1)}
              <span className="text-base font-medium text-text-muted">
                {" "}
                / {required} hrs
              </span>
            </span>
            <span className="text-sm font-semibold text-primary">
              {percent.toFixed(0)}%
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-surface overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>

          {completed && (
            <button
              onClick={() => setShowCertificate(true)}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors"
            >
              <Award className="w-4 h-4" />
              View Certificate
            </button>
          )}
        </div>

        {/* Academic info */}
        <div className="bg-canvas rounded-2xl border border-border p-6">
          <h2 className="text-sm font-semibold text-text flex items-center gap-2 mb-5">
            <UserRound className="w-4 h-4 text-primary" />
            Profile Information
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-text mb-2">
              Full Name
            </label>
            <input
              type="text"
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-canvas text-text text-sm placeholder:text-text-subtle focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="Your certificate name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-text-muted">
              Used on your certificate of completion.
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
              Used in greetings, sidebar, and leaderboard rows.
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
              className="w-full sm:w-48 px-3 py-2.5 rounded-lg border border-border bg-canvas text-text text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              value={requiredHours}
              onChange={(e) => setRequiredHours(Number(e.target.value) || 0)}
            />
            <p className="mt-1.5 text-xs text-text-muted">
              The total hours your program requires (default {DEFAULT_REQUIRED_HOURS}).
            </p>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={handleSave}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? "Saving..." : "Save Changes"}
            </button>
            {saved && (
              <span className="text-sm text-success font-medium">Saved!</span>
            )}
          </div>
        </div>
      </div>

      <CertificateModal
        open={showCertificate}
        onClose={() => setShowCertificate(false)}
        data={certificateData}
      />
    </>
  );
}
