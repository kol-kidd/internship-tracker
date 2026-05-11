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
} from "lucide-react";

import SEO from "@/components/SEO";
import { useAppStore } from "@/store/applicationStore";
import Card from "@/components/Application/Card";
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
    "board",
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
      filtered = filtered.filter(
        (app: Application) =>
          app.position?.toLowerCase().includes(searchQuery.toLowerCase()) ??
          false,
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
      <div className="flex flex-col min-h-screen bg-surface">
        {/* Main content */}
        <main className="flex-1 flex flex-col min-w-0">
          <div className="sticky top-0 z-10 bg-canvas border-b border-border px-6 py-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <h1 className="text-3xl font-semibold text-text tracking-tight">
                  Applications
                </h1>
                <p className="text-sm text-text-muted">
                  Manage and track your career opportunities.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleModal()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors"
                >
                  <Plus size={18} />
                  <span>New Application</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[300px] relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted opacity-50" />
                <input
                  type="text"
                  placeholder="Search companies, roles, or locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-border bg-surface text-sm text-text placeholder-text-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 p-1 bg-surface rounded-lg">
                {[
                  { id: "board", icon: LayoutGrid, label: "Board" },
                  { id: "list", icon: List, label: "List" },
                  { id: "journey", icon: History, label: "Timeline" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() =>
                      setViewMode(mode.id as "board" | "list" | "journey")
                    }
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold transition-colors ${
                      viewMode === mode.id
                        ? "bg-canvas text-text shadow-sm"
                        : "text-text-muted hover:text-text"
                    }`}
                  >
                    <mode.icon size={16} />
                    <span>{mode.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 ml-auto">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-canvas text-sm font-semibold text-text-muted hover:text-text hover:bg-surface cursor-pointer transition-colors group"
                >
                  <Download
                    size={16}
                    className="group-hover:translate-y-0.5 transition-transform"
                  />
                  <span>PDF Report</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadJourneyCsv(applications)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-canvas text-sm font-semibold text-text-muted hover:text-text hover:bg-surface cursor-pointer transition-colors"
                >
                  <Download size={16} />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar px-6">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  statusFilter === "all"
                    ? "bg-primary text-white"
                    : "bg-black/5 text-text-muted hover:bg-black/10 hover:text-text"
                }`}
              >
                All ({applications.length})
              </button>
              {Object.entries(statusConfig).map(([status, config]) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    statusFilter === status
                      ? "bg-primary text-white"
                      : "bg-black/5 text-text-muted hover:bg-black/10 hover:text-text"
                  }`}
                >
                  {config.label} ({statusCounts[status] || 0})
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 lg:p-12">
            {hasAcceptedApplication && !tipDismissed && (
              <div className="mb-8 rounded-xl border border-success/20 bg-success/5 p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
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
                      className="px-4 py-2 rounded-lg bg-success text-white text-xs font-semibold hover:opacity-90 transition-colors"
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
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <Trophy className="text-warning" size={24} />
                    <h2 className="text-2xl font-semibold tracking-tight">
                    Accepted Application
                  </h2>
                </div>
                <div className="rounded-2xl border border-warning/20 bg-canvas p-6">
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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredAndSortedApps.map((app) => (
                  <Card
                    key={app.id}
                    {...app}
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
                  <div className="col-span-full py-20 text-center">
                    <div className="w-20 h-20 rounded-xl bg-black/5 flex items-center justify-center mx-auto mb-6">
                      <Search className="w-10 h-10 text-text-muted opacity-30" />
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
