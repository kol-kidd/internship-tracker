import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Plus,
  Briefcase,
  X,
  CheckCircle2,
  LayoutGrid,
  List,
  History,
  Trophy,
  Download,
  Calendar,
  MapPin,
  Edit2,
  Trash2,
  ChevronDown,
} from "lucide-react";

import SEO from "@/components/SEO";
import { useAppStore } from "@/store/applicationStore";
import Modal from "@/components/Application/Modal";
import KanbanBoard from "@/components/Application/KanbanBoard";
import JourneyTimeline from "@/components/Application/JourneyTimeline";
import OnboardingChecklist from "@/components/Application/OnboardingChecklist";
import JourneyStatCard from "@/components/Application/JourneyStatCard";
import { triggerConfetti } from "@/lib/confetti";
import { downloadJourneyCsv, downloadJourneyPdf } from "@/lib/exportJourney";
import { getJourneySummary } from "@/functions/ai/journalAI";
import { useAuthStore } from "@/store/authStore";
import { toast, Bounce } from "react-toastify";
import ConfirmationDialog from "@/components/Application/ConfirmationDialog";
import LoadingOverlay from "@/components/Loading";

const ACCEPTED_TIP_DISMISSED_KEY = "application_list_accepted_tip_dismissed";

interface Application {
  id: number;
  user_id: string;
  company_name: string;
  company_address: string;
  date_applied: string;
  status: string;
  created_at: string;
  position?: string;
  notes?: string;
  stipend?: "paid" | "unpaid";
}

type StatusType =
  | "applied"
  | "interviewing"
  | "offer"
  | "rejected"
  | "accepted"
  | "withdrawn";

interface StatusConfig {
  color: string;
  label: string;
}

const statusConfig: Record<StatusType, StatusConfig> = {
  applied: {
    color: "bg-primary/5 text-primary border-primary/10",
    label: "Applied",
  },
  interviewing: {
    color: "bg-info/5 text-info border-info/10",
    label: "Interviewing",
  },
  offer: {
    color: "bg-success/5 text-success border-success/10",
    label: "Offer",
  },
  rejected: {
    color: "bg-error/5 text-error border-error/10",
    label: "Rejected",
  },
  accepted: {
    color: "bg-success/10 text-success border-success/20",
    label: "Accepted",
  },
  withdrawn: {
    color: "bg-black/5 text-text-muted border-black/10",
    label: "Withdrawn",
  },
};

const statusOptions = Object.entries(statusConfig) as [
  StatusType,
  StatusConfig,
][];

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ApplicationListItem({
  app,
  onEdit,
  onDelete,
  onStatusUpdate,
  disabled,
}: {
  app: Application;
  onEdit: () => void;
  onDelete: () => void;
  onStatusUpdate: (status: string) => void;
  disabled: boolean;
}) {
  const status = app.status.toLowerCase() as StatusType;
  const config = statusConfig[status] ?? statusConfig.applied;

  return (
    <article className="app-data-row p-4">
      <div className="flex flex-col gap-4 sm:grid sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_150px_88px] sm:items-center">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-text truncate">
            {app.company_name}
          </h3>
          <p className="mt-1 text-sm text-text-muted truncate">
            {app.position || "Internship Role"}
          </p>
        </div>

        <div className="min-w-0 space-y-1 text-xs text-text-muted">
          <p className="flex items-center gap-1.5 min-w-0">
            <MapPin className="w-3.5 h-3.5 shrink-0 opacity-60" />
            <span className="truncate">{app.company_address}</span>
          </p>
          <p className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 shrink-0 opacity-60" />
            <span>Applied {formatDate(app.date_applied)}</span>
          </p>
        </div>

        <div className="relative">
          <select
            value={status}
            onChange={(event) => onStatusUpdate(event.target.value)}
            disabled={disabled}
            className={`w-full appearance-none rounded-lg border px-3 py-2 pr-8 text-xs font-semibold capitalize focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60 ${config.color}`}
          >
            {statusOptions.map(([value, option]) => (
              <option key={value} value={value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-current opacity-60" />
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-muted transition-colors hover:border-primary/30 hover:text-primary"
            aria-label={`Edit ${app.company_name}`}
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-muted transition-colors hover:border-error/30 hover:text-error"
            aria-label={`Delete ${app.company_name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

export default function ApplicationList() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);

  const [selectedAppId, setSelectedAppId] = useState<number>();
  const [selectedAppName, setSelectedAppName] = useState<string>("");
  const [selectedAppAddress, setSelectedAppAddress] = useState<string>("");
  const [selectedAppPosition, setSelectedAppPosition] = useState<string>("");
  const [selectedAppStipend, setSelectedAppStipend] = useState<
    "paid" | "unpaid" | undefined
  >(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [markAllWithdrawnDialogOpen, setMarkAllWithdrawnDialogOpen] =
    useState(false);
  const [tipDismissed, setTipDismissed] = useState(() =>
    Boolean(localStorage.getItem(ACCEPTED_TIP_DISMISSED_KEY)),
  );
  const [viewMode, setViewMode] = useState<"board" | "list" | "journey">(
    "list",
  );
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const { session } = useAuthStore();
  const {
    applications,
    loading,
    deleteApplication: storeDeleteApplication,
    updateApplicationStatus: storeUpdateStatus,
    initSocket,
  } = useAppStore();

  useEffect(() => {
    initSocket();
  }, [initSocket]);

  const hasAcceptedApplication = useMemo(
    () => applications.some((app) => app.status.toLowerCase() === "accepted"),
    [applications],
  );

  const filteredAndSortedApps = useMemo(() => {
    let filtered = [...applications];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (app: Application) =>
          app.company_name.toLowerCase().includes(query) ||
          app.company_address.toLowerCase().includes(query) ||
          app.status.toLowerCase().includes(query) ||
          (app.position?.toLowerCase().includes(query) ?? false),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (app: Application) =>
          app.status.toLowerCase() === statusFilter.toLowerCase(),
      );
    }

    return filtered.sort((a: Application, b: Application) => {
      if (statusFilter === "all") {
        const aAccepted = a.status.toLowerCase() === "accepted";
        const bAccepted = b.status.toLowerCase() === "accepted";
        if (aAccepted && !bAccepted) return -1;
        if (!aAccepted && bAccepted) return 1;
      }
      return (
        new Date(b.date_applied).getTime() - new Date(a.date_applied).getTime()
      );
    });
  }, [applications, searchQuery, statusFilter]);

  const statusCounts = useMemo(() => {
    return applications.reduce(
      (acc: Record<string, number>, app: Application) => {
        const status = app.status.toLowerCase();
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {},
    );
  }, [applications]);

  const activeCount =
    (statusCounts.applied || 0) +
    (statusCounts.interviewing || 0) +
    (statusCounts.offer || 0);

  const acceptedApplication = useMemo(
    () => applications.find((app) => app.status.toLowerCase() === "accepted"),
    [applications],
  );

  const journeyStats = useMemo(() => {
    const total = applications.length;
    const interviewed = applications.filter((app) =>
      ["interviewing", "offer", "accepted"].includes(app.status.toLowerCase()),
    ).length;
    const accepted = applications.find(
      (a) => a.status.toLowerCase() === "accepted",
    );
    if (!accepted)
      return {
        totalApplied: total,
        totalInterviewing: interviewed,
        daysToAccept: 0,
      };
    const firstDate = applications.reduce(
      (min, a) =>
        new Date(a.date_applied) < min ? new Date(a.date_applied) : min,
      new Date(accepted.date_applied),
    );
    const diff =
      new Date(accepted.date_applied).getTime() - firstDate.getTime();
    const daysToAccept = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    return {
      totalApplied: total,
      totalInterviewing: interviewed,
      daysToAccept,
    };
  }, [applications]);

  const handleModal = () => {
    if (open) {
      setIsUpdating(false);
      setIsCreating(false);
      setSelectedAppId(undefined);
      setSelectedAppName("");
      setSelectedAppAddress("");
      setSelectedAppPosition("");
      setSelectedAppStipend(undefined);
    }
    setOpen(!open);
  };

  const handleEditApplication = (
    appId: number,
    companyName: string,
    companyAddress: string,
    position?: string,
    stipend?: "paid" | "unpaid",
  ) => {
    setSelectedAppId(appId);
    setSelectedAppName(companyName);
    setSelectedAppAddress(companyAddress);
    setSelectedAppPosition(position ?? "");
    setSelectedAppStipend(stipend);
    setOpen(true);
  };

  const handleDeleteClick = (appId: number, companyName: string) => {
    setSelectedAppId(appId);
    setSelectedAppName(companyName);
    setDeleteDialogOpen(true);
  };

  const handleDeleteApplication = async (confirmed: boolean) => {
    setDeleteDialogOpen(false);
    if (!confirmed || !selectedAppId) return;
    setIsDeleting(true);

    try {
      await storeDeleteApplication(selectedAppId);

      toast.success("Delete successful", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
    } catch (error) {
      console.error(error);
      toast.error("Delete unsuccessful", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusUpdate = async (appId: number, newStatus: string) => {
    setIsUpdating(true);
    try {
      await storeUpdateStatus(appId, newStatus);
      if (newStatus.toLowerCase() === "accepted") triggerConfetti();
      toast.info("Application status updated", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkAllWithdrawnClick = () => setMarkAllWithdrawnDialogOpen(true);

  const handleMarkAllWithdrawn = async (confirmed: boolean) => {
    setMarkAllWithdrawnDialogOpen(false);
    if (!confirmed) return;

    const toWithdraw = applications.filter(
      (app) => app.status.toLowerCase() !== "accepted",
    );
    if (toWithdraw.length === 0) return;
    setIsUpdating(true);
    try {
      await Promise.all(
        toWithdraw.map((app) => storeUpdateStatus(app.id, "withdrawn")),
      );
      toast.success(
        `${toWithdraw.length} application${
          toWithdraw.length === 1 ? "" : "s"
        } marked as Withdrawn`,
        {
          position: "top-right",
          theme: "light",
          transition: Bounce,
        },
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to update some applications", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const dismissTip = () => {
    setTipDismissed(true);
    localStorage.setItem(ACCEPTED_TIP_DISMISSED_KEY, "1");
  };

  const handleDownloadPdf = async () => {
    try {
      let narrative: string | null = null;
      if (session?.access_token && applications.length > 0) {
        try {
          narrative = await getJourneySummary(
            applications.map((a) => ({
              date_applied: a.date_applied,
              company_name: a.company_name,
              position: a.position,
              status: a.status,
            })),
            session.access_token,
          );
        } catch {
          // proceed without narrative
        }
      }
      downloadJourneyPdf(applications, narrative);
      toast.success("Timeline report downloaded", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
    } catch (e) {
      console.error(e);
      toast.error("Failed to download PDF", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
    }
  };

  if (loading && applications.length === 0) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4 ">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
          </div>
          <p className="text-sm font-bold text-text tracking-tight">
            Loading internship tracker...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Applications"
        description="Track and manage all your internship applications. Filter by status, search companies, and stay organized."
      />
      <div className="app-route-frame flex flex-col">
        {/* Main content */}
        <main className="flex-1 flex flex-col min-w-0">
          <div className="app-page-titlebar sticky top-0 z-10 px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-2xl font-semibold text-text tracking-tight">
                      Applications
                    </h1>
                    <p className="text-sm text-text-muted">
                      {applications.length} total opportunities, {activeCount} active
                    </p>
                  </div>
                </div>
              </div>

              <div className="app-toolbar flex flex-col gap-3 p-2 lg:flex-row lg:items-center">
                <div className="relative w-full lg:w-80">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted opacity-60" />
                  <input
                    type="text"
                    placeholder="Search applications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 w-full rounded-xl border border-border bg-canvas py-2.5 pl-10 pr-4 text-sm text-text placeholder-text-muted/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                  />
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:flex sm:items-center">
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="h-10 w-full appearance-none rounded-xl border border-border bg-canvas px-3 pr-8 text-sm font-medium text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 sm:w-44"
                    >
                      <option value="all">All ({applications.length})</option>
                      {statusOptions.map(([status, config]) => (
                        <option key={status} value={status}>
                          {config.label} ({statusCounts[status] || 0})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  </div>

                  <div className="app-segment flex h-10 items-center gap-1">
                    {[
                      { id: "list", icon: List, label: "List" },
                      { id: "board", icon: LayoutGrid, label: "Board" },
                      { id: "journey", icon: History, label: "Timeline" },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() =>
                          setViewMode(mode.id as "board" | "list" | "journey")
                        }
                        className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors sm:gap-1.5 sm:px-3 ${
                          viewMode === mode.id
                            ? "bg-canvas text-text shadow-sm"
                            : "text-text-muted hover:text-text"
                        }`}
                        aria-label={`Show ${mode.label}`}
                        title={mode.label}
                      >
                        <mode.icon size={15} />
                        <span className="hidden sm:inline">{mode.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-canvas px-3 text-sm font-semibold text-text-muted transition-colors hover:bg-surface hover:text-text"
                    aria-label="Download PDF report"
                  >
                    <Download size={16} />
                    <span className="hidden sm:inline">PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadJourneyCsv(applications)}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-canvas px-3 text-sm font-semibold text-text-muted transition-colors hover:bg-surface hover:text-text"
                    aria-label="Download CSV"
                  >
                    <Download size={16} />
                    <span className="hidden sm:inline">CSV</span>
                  </button>
                </div>

                <button
                  onClick={() => handleModal()}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                >
                  <Plus size={18} />
                  <span>New Application</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="app-metric-card p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-text-muted">
                  Active Search
                </p>
                <p className="mt-2 text-2xl font-semibold text-text">
                  {activeCount}
                </p>
              </div>
              <div className="app-metric-card p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-text-muted">
                  Interviews
                </p>
                <p className="mt-2 text-2xl font-semibold text-text">
                  {statusCounts.interviewing || 0}
                </p>
              </div>
              <div className="app-metric-card p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-text-muted">
                  Accepted
                </p>
                <p className="mt-2 text-2xl font-semibold text-text">
                  {statusCounts.accepted || 0}
                </p>
              </div>
            </div>

            {hasAcceptedApplication && !tipDismissed && (
              <div className="app-callout mb-8 p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold text-text mb-1">
                    Accepted application found
                  </p>
                  <p className="text-sm font-medium text-text-muted mb-4">
                    Consider marking your other active applications as withdrawn
                    to stay organized.
                  </p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleMarkAllWithdrawnClick}
                      className="px-4 py-2 rounded-xl bg-success text-white text-xs font-semibold hover:opacity-90 transition-colors"
                    >
                      Mark others as withdrawn
                    </button>
                    <button
                      onClick={dismissTip}
                      className="text-xs font-bold text-text-muted uppercase tracking-wider hover:text-text transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
                <button
                  onClick={dismissTip}
                  className="p-2 rounded-xl text-text-muted hover:bg-black/5 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            )}

            {hasAcceptedApplication && acceptedApplication && (
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <Trophy className="text-warning" size={24} />
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Accepted Application
                  </h2>
                </div>
                <div className="app-hero-panel p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="space-y-4">
                      <div>
                        <span className="px-3 py-1 rounded-full bg-warning/10 text-warning text-[10px] font-bold uppercase tracking-widest">
                          Accepted
                        </span>
                        <h3 className="text-3xl font-bold mt-2">
                          {acceptedApplication.company_name}
                        </h3>
                        <p className="text-lg font-bold text-text-muted">
                          {acceptedApplication.position || "Internship Role"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        <JourneyStatCard
                          totalApplied={journeyStats.totalApplied}
                          totalInterviewing={journeyStats.totalInterviewing}
                          daysToAccept={journeyStats.daysToAccept}
                        />
                      </div>
                    </div>
                    <div className="w-full lg:w-1/2">
                      <OnboardingChecklist
                        applicationId={acceptedApplication.id}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {viewMode === "board" && (
              <div className="space-y-8">
                <KanbanBoard
                  applications={filteredAndSortedApps}
                  onStatusChange={handleStatusUpdate}
                  onEdit={handleEditApplication}
                  onDelete={handleDeleteClick}
                />
              </div>
            )}

            {viewMode === "list" && (
              <div className="space-y-3">
                {filteredAndSortedApps.map((app) => (
                  <ApplicationListItem
                    key={app.id}
                    app={app}
                    disabled={isUpdating}
                    onDelete={() => handleDeleteClick(app.id, app.company_name)}
                    onEdit={() =>
                      handleEditApplication(
                        app.id,
                        app.company_name,
                        app.company_address,
                        app.position,
                        app.stipend,
                      )
                    }
                    onStatusUpdate={(status) =>
                      handleStatusUpdate(app.id, status)
                    }
                  />
                ))}
                {filteredAndSortedApps.length === 0 && (
                  <div className="app-empty-state py-20 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                      <Search className="w-10 h-10 text-primary/40" />
                    </div>
                    <h3 className="text-xl font-bold text-text">
                      No matches found
                    </h3>
                    <p className="text-text-muted font-medium">
                      Try adjusting your search or filters.
                    </p>
                  </div>
                )}
              </div>
            )}

            {viewMode === "journey" && (
              <div>
                <JourneyTimeline applications={applications} />
              </div>
            )}
          </div>
        </main>
      </div>
      <Modal
        open={open}
        handleModal={handleModal}
        isUpdate={!!selectedAppId}
        appId={selectedAppId}
        companyName={selectedAppName}
        companyAddress={selectedAppAddress}
        position={selectedAppPosition}
        stipend={selectedAppStipend}
      />
      <ConfirmationDialog
        open={deleteDialogOpen}
        onClose={handleDeleteApplication}
        itemName={selectedAppName}
        title="Delete Application"
        description="Are you sure you want to delete this application? This action cannot be undone."
      />
      <ConfirmationDialog
        open={markAllWithdrawnDialogOpen}
        onClose={handleMarkAllWithdrawn}
        title="Withdraw All Others"
        description="This will mark all other active applications as Withdrawn."
        variant="primary"
        confirmLabel="Confirm"
      />
      {(isDeleting ||
        isUpdating ||
        isCreating ||
        (loading && applications.length === 0)) && (
        <LoadingOverlay open={true} />
      )}
    </>
  );
}
