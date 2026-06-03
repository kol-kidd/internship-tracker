import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Award,
  Check,
  Clock,
  Mail,
  Palette,
  Save,
  UserRound,
} from "lucide-react";
import SEO from "@/components/SEO";
import SchoolFields, { type AcademicInfo } from "@/components/SchoolFields";
import CertificateModal from "@/components/CertificateModal";
import type { CertificateData } from "@/components/Certificate";
import { useProfileStore } from "@/store/profileStore";
import { useAuthStore } from "@/store/authStore";
import { DEFAULT_REQUIRED_HOURS } from "@/lib/academicPresets";
import { getInitial, getProfileDisplayName } from "@/lib/profileIdentity";
import {
  applyTheme,
  getStoredTheme,
  THEME_OPTIONS,
  type ThemePreference,
} from "@/lib/theme";

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
  const [themePreference, setThemePreference] = useState<ThemePreference>(() =>
    getStoredTheme(),
  );
  const [themeSaving, setThemeSaving] = useState(false);
  const [themeError, setThemeError] = useState<string | null>(null);
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
      setThemePreference(profile.theme_preference);
      applyTheme(profile.theme_preference);
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
      theme_preference: themePreference,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleThemeSelect = async (theme: ThemePreference) => {
    const previousTheme = themePreference;
    setThemePreference(theme);
    applyTheme(theme);
    setThemeError(null);
    setThemeSaving(true);

    const result = await updateProfile({ theme_preference: theme });

    if (result) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      setThemePreference(previousTheme);
      applyTheme(previousTheme);
      setThemeError("Could not save your theme. Please try again.");
    }

    setThemeSaving(false);
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

      <div className="max-w-5xl mx-auto space-y-6">
        {setupIncomplete && (
          <div className="app-callout p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
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
        <div className="app-hero-panel p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
                {initial}
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-semibold text-text truncate">
                  {displayName}
                </h1>
                <p className="text-sm text-text-muted flex items-center gap-1.5 mt-1">
                  <Mail className="w-3.5 h-3.5" />
                  {profile?.email || user?.email}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:w-[320px]">
              <div className="rounded-xl border border-border bg-canvas/80 p-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">
                  Hours
                </p>
                <p className="mt-1 text-lg font-semibold text-text">
                  {total.toFixed(1)}h
                </p>
              </div>
              <div className="rounded-xl border border-border bg-canvas/80 p-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">
                  Required
                </p>
                <p className="mt-1 text-lg font-semibold text-text">
                  {required}h
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        {/* Progress card */}
        <div className="app-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Internship Progress
            </h2>
            {completed && (
              <span className="text-xs font-semibold text-success bg-success/10 px-2.5 py-1 rounded-full">
                Completed
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
              className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors"
            >
              <Award className="w-4 h-4" />
              View Certificate
            </button>
          )}
        </div>

        {/* Appearance */}
        <div className="app-panel p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-sm font-semibold text-text flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" />
                Appearance
              </h2>
              <p className="mt-1 text-xs text-text-muted">
                Choose a theme for your workspace.
              </p>
            </div>
            {themeSaving && (
              <span className="text-xs font-medium text-text-muted">
                Saving...
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {THEME_OPTIONS.map((theme) => {
              const selected = themePreference === theme.id;

              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => handleThemeSelect(theme.id)}
                  disabled={themeSaving}
                  className={`text-left rounded-xl border p-4 transition-colors ${
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-surface hover:border-primary/30 hover:bg-canvas"
                  } disabled:cursor-not-allowed disabled:opacity-70`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text">
                        {theme.label}
                      </p>
                      <p className="mt-1 text-xs text-text-muted">
                        {theme.description}
                      </p>
                    </div>
                    <span
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${
                        selected
                          ? "bg-primary text-white border-primary"
                          : "border-border bg-canvas"
                      }`}
                    >
                      {selected && <Check className="w-3.5 h-3.5" />}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    {theme.swatches.map((swatch) => (
                      <span
                        key={swatch}
                        className="h-7 flex-1 rounded-lg border border-border"
                        style={{ backgroundColor: swatch }}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          {themeError && (
            <p className="mt-3 text-xs font-medium text-error">{themeError}</p>
          )}
        </div>
        </div>

        {/* Academic info */}
        <div className="app-panel p-6">
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
