import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Download,
  FileText,
  ImagePlus,
  Mail,
  Plus,
  UserRound,
} from "lucide-react";
import SEO from "@/components/SEO";
import OnboardingChecklist from "@/components/Application/OnboardingChecklist";
import ReportReadinessPanel from "@/components/ReportReadinessPanel";
import { useAppStore } from "@/store/applicationStore";
import { useJournalStore } from "@/store/journalStore";
import { useGalleryStore } from "@/store/galleryStore";
import { useProfileStore } from "@/store/profileStore";
import { formatLogDate, getTotalLoggedHours } from "@/lib/hours";
import { getReportReadiness, type ReadinessTarget } from "@/lib/reportReadiness";
import { generateSupervisorVerificationPDF } from "@/lib/exportVerification";

function formatDate(value?: string | null) {
  return value ? formatLogDate(value) : "Not set";
}

export default function InternshipWorkspace() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const id = Number(applicationId);

  const { applications, fetchApplications, loading } = useAppStore();
  const { entries, fetchEntries } = useJournalStore();
  const { images, fetchGallery } = useGalleryStore();
  const { profile } = useProfileStore();

  useEffect(() => {
    void fetchApplications({ showLoading: false });
    void fetchEntries();
  }, [fetchApplications, fetchEntries]);

  useEffect(() => {
    if (entries.length > 0) void fetchGallery();
  }, [entries.length, fetchGallery]);

  const application = applications.find((app) => app.id === id);
  const scopedEntries = useMemo(
    () => entries.filter((entry) => entry.application_id === id),
    [entries, id],
  );
  const scopedEntryIds = useMemo(
    () => new Set(scopedEntries.map((entry) => entry.id)),
    [scopedEntries],
  );
  const scopedImages = useMemo(
    () =>
      images.filter(
        (image) =>
          image.journal_entry_id != null && scopedEntryIds.has(image.journal_entry_id),
      ),
    [images, scopedEntryIds],
  );
  const totalHours = getTotalLoggedHours(scopedEntries);
  const readiness = getReportReadiness({
    entries: scopedEntries,
    images: scopedImages,
    profile,
  });
  const requiredHours = profile?.required_hours ?? 0;
  const progress =
    requiredHours > 0 ? Math.min(100, (totalHours / requiredHours) * 100) : 0;

  const goToLogs = (target: ReadinessTarget = "entries") => {
    if (target === "profile") {
      navigate("/profile");
      return;
    }

    const view = target === "evidence" ? "evidence" : target;
    navigate(`/logs?view=${view}&application=${id}`);
  };

  if (loading && !application) {
    return (
      <div className="app-panel p-8 text-center text-sm text-text-muted">
        Loading internship workspace...
      </div>
    );
  }

  if (!application) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <button
          type="button"
          onClick={() => navigate("/applications")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to applications
        </button>
        <div className="app-empty-state p-8 text-center">
          <h1 className="text-xl font-semibold text-text">
            Internship not found
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            This workspace needs an application that belongs to your account.
          </p>
        </div>
      </div>
    );
  }

  if (application.status.toLowerCase() !== "accepted") {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <button
          type="button"
          onClick={() => navigate("/applications")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to applications
        </button>
        <div className="app-callout p-6">
          <h1 className="text-xl font-semibold text-text">
            Workspace unlocks after acceptance
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Mark this application as Accepted to use internship logs, onboarding,
            supervisor details, and report exports from one workspace.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`${application.company_name} Workspace`}
        description="Accepted internship command center."
      />

      <div className="space-y-6">
        <button
          type="button"
          onClick={() => navigate("/applications")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to applications
        </button>

        <section className="app-hero-panel p-5 sm:p-6 lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-success">
                <Briefcase className="h-4 w-4" />
                Accepted Internship
              </div>
              <h1 className="mt-4 truncate text-3xl font-semibold tracking-tight text-text">
                {application.company_name}
              </h1>
              <p className="mt-2 text-base font-medium text-text-muted">
                {application.position || "Internship Role"}
                {application.department ? ` - ${application.department}` : ""}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate(`/logs?view=entries&application=${id}&new=today`)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgb(11_115_217_/_0.2)] transition-colors hover:bg-primary-hover"
                >
                  <Plus className="h-4 w-4" />
                  Add scoped log
                </button>
                <button
                  type="button"
                  onClick={() =>
                    generateSupervisorVerificationPDF({
                      application,
                      entries: scopedEntries,
                      profile,
                      evidenceCount: scopedImages.length,
                    })
                  }
                  disabled={scopedEntries.length === 0}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-canvas px-5 py-3 text-sm font-semibold text-text transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  Verification PDF
                </button>
              </div>
            </div>

            <aside className="rounded-2xl border border-border bg-canvas/80 p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                Hours Progress
              </p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-text">
                {totalHours.toFixed(1)}
                <span className="text-base font-medium text-text-muted">
                  {" "}
                  / {requiredHours || "set"} hrs
                </span>
              </p>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-surface">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-border bg-surface p-3">
                  <p className="text-text-muted">Entries</p>
                  <p className="font-semibold text-text">{scopedEntries.length}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface p-3">
                  <p className="text-text-muted">Evidence</p>
                  <p className="font-semibold text-text">{scopedImages.length}</p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <ReportReadinessPanel readiness={readiness} onAction={goToLogs} />

            <section className="app-panel p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-text">
                    Recent Journal Entries
                  </h2>
                  <p className="text-sm text-text-muted">
                    Daily record for this accepted internship.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => goToLogs("entries")}
                  className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-text-muted hover:bg-surface hover:text-text"
                >
                  <FileText className="h-4 w-4" />
                  Journal
                </button>
              </div>
              {scopedEntries.length === 0 ? (
                <div className="app-empty-state p-8 text-center">
                  <p className="font-semibold text-text">No logs yet</p>
                  <p className="mt-1 text-sm text-text-muted">
                    Add today's scoped log to start the internship record.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scopedEntries.slice(0, 5).map((entry) => (
                    <article
                      key={entry.id}
                      className="rounded-xl border border-border-subtle bg-surface p-4"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="min-w-0 truncate font-semibold text-text">
                          {entry.title}
                        </h3>
                        <span className="text-xs font-medium text-text-muted">
                          {formatDate(entry.date)}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-text-muted">
                        {entry.content}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="app-panel p-5">
              <h2 className="text-lg font-semibold text-text">
                Supervisor
              </h2>
              <div className="mt-4 space-y-3 text-sm">
                <p className="flex items-center gap-2 text-text-muted">
                  <UserRound className="h-4 w-4 text-primary" />
                  <span>{application.supervisor_name || "No supervisor yet"}</span>
                </p>
                <p className="flex items-center gap-2 text-text-muted">
                  <Mail className="h-4 w-4 text-primary" />
                  <span className="truncate">
                    {application.supervisor_email || "No email yet"}
                  </span>
                </p>
                <p className="flex items-center gap-2 text-text-muted">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>
                    {formatDate(application.start_date)} to {formatDate(application.end_date)}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/applications")}
                className="mt-4 w-full rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-text hover:bg-surface"
              >
                Edit application details
              </button>
            </section>

            <section className="app-panel p-5">
              <div className="mb-4 flex items-center gap-2">
                <ImagePlus className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-text">
                  Evidence
                </h2>
              </div>
              {scopedImages.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-surface p-5 text-center text-sm text-text-muted">
                  No evidence linked to this internship yet.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {scopedImages.slice(0, 6).map((image) => (
                    <a
                      key={image.id}
                      href={image.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-square overflow-hidden rounded-xl border border-border bg-surface"
                    >
                      <img
                        src={image.image_url}
                        alt={image.caption || "Proof of work"}
                        className="h-full w-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => goToLogs("evidence")}
                className="mt-4 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
              >
                Add evidence
              </button>
            </section>

            <section className="app-panel p-5">
              <OnboardingChecklist applicationId={application.id} />
            </section>
          </aside>
        </div>
      </div>
    </>
  );
}
