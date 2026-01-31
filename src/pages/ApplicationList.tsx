import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Plus,
  Briefcase,
  Sparkles,
  X,
  CheckCircle2,
} from "lucide-react";

const ACCEPTED_TIP_DISMISSED_KEY = "application_list_accepted_tip_dismissed";
import SEO from "@/components/SEO";
import { useAppStore } from "@/store/applicationStore";
import Card from "@/components/Application/Card";
import SortMenu from "@/components/Dropdown";
import Modal from "@/components/Application/Modal";
import { Bounce, toast } from "react-toastify";
import ConfirmationDialog from "@/components/Application/ConfirmationDialog";
import LoadingOverlay from "@/components/Loading";

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
}

type StatusType =
  | "applied"
  | "interviewing"
  | "offer"
  | "rejected"
  | "accepted"
  | "withdrawn";

type SortByType = "date_desc" | "date_asc" | "company_asc" | "company_desc";

interface StatusConfig {
  color: string;
  label: string;
  gradient: string;
}

const statusConfig: Record<StatusType, StatusConfig> = {
  applied: {
    color: "bg-blue-100 text-blue-700 border-blue-200",
    label: "Applied",
    gradient: "from-blue-500 to-blue-600",
  },
  interviewing: {
    color: "bg-purple-100 text-purple-700 border-purple-200",
    label: "Interviewing",
    gradient: "from-purple-500 to-purple-600",
  },
  offer: {
    color: "bg-green-100 text-green-700 border-green-200",
    label: "Offer Received",
    gradient: "from-green-500 to-green-600",
  },
  rejected: {
    color: "bg-red-100 text-red-700 border-red-200",
    label: "Rejected",
    gradient: "from-red-500 to-red-600",
  },
  accepted: {
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    label: "Accepted",
    gradient: "from-emerald-500 to-emerald-600",
  },
  withdrawn: {
    color: "bg-gray-100 text-gray-700 border-gray-200",
    label: "Withdrawn",
    gradient: "from-gray-500 to-gray-600",
  },
};

export default function ApplicationList() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortByType>("date_desc");
  const [open, setOpen] = useState(false);

  const [selectedAppId, setSelectedAppId] = useState<number>();
  const [selectedAppName, setSelectedAppName] = useState<string>("");
  const [selectedAppAddress, setSelectedAppAddress] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [markAllWithdrawnDialogOpen, setMarkAllWithdrawnDialogOpen] =
    useState(false);
  const [tipDismissed, setTipDismissed] = useState(() =>
    Boolean(localStorage.getItem(ACCEPTED_TIP_DISMISSED_KEY)),
  );
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    applications,
    loading,
    deleteApplication: storeDeleteApplication,
    updateApplicationStatus: storeUpdateStatus,
    initSocket,
  } = useAppStore();

  useEffect(() => {
    initSocket();
  }, []);

  const hasAcceptedApplication = useMemo(
    () =>
      applications.some((app) => app.status.toLowerCase() === "accepted"),
    [applications],
  );

  const filteredAndSortedApps = useMemo(() => {
    let filtered = [...applications];

    if (searchQuery) {
      filtered = filtered.filter(
        (app: Application) =>
          app.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.company_address
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (app.position?.toLowerCase().includes(searchQuery.toLowerCase()) ??
            false),
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
      switch (sortBy) {
        case "date_desc":
          return (
            new Date(b.date_applied).getTime() -
            new Date(a.date_applied).getTime()
          );
        case "date_asc":
          return (
            new Date(a.date_applied).getTime() -
            new Date(b.date_applied).getTime()
          );
        case "company_asc":
          return a.company_name.localeCompare(b.company_name);
        case "company_desc":
          return b.company_name.localeCompare(a.company_name);
        default:
          return 0;
      }
    });
  }, [applications, searchQuery, statusFilter, sortBy]);

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

  const getStatusConfig = (status: string): StatusConfig => {
    return (
      statusConfig[status.toLowerCase() as StatusType] || statusConfig.applied
    );
  };

  const handleModal = () => {
    if (open) {
      setIsUpdating(false);
      setIsCreating(false);
      setSelectedAppId(undefined);
      setSelectedAppName("");
      setSelectedAppAddress("");
    }
    setOpen(!open);
  };

  const handleEditApplication = (
    appId: number,
    companyName: string,
    companyAddress: string,
  ) => {
    setSelectedAppId(appId);
    setSelectedAppName(companyName);
    setSelectedAppAddress(companyAddress);
    setIsUpdating(true);
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

  const handleMarkAllWithdrawnConfirm = async (confirmed: boolean) => {
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
        `${toWithdraw.length} application${toWithdraw.length === 1 ? "" : "s"} marked as Withdrawn`,
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

  const handleViewApplication = (appId: number) => {
    console.log("View application:", appId);
  };

  if (loading && !isDeleting && !isUpdating && !isCreating) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-white animate-pulse" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-soft-blue animate-ping" />
          </div>
          <p className="text-text-muted">Loading applications...</p>
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
      <div className="flex min-h-screen bg-surface">
        {/* Sidebar */}
        <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:border-r lg:border-border lg:bg-canvas lg:shrink-0">
          <div className="sticky top-0 flex flex-col h-screen overflow-y-auto p-5">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <Briefcase className="w-5 h-5 text-primary" />
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  Applications
                </span>
              </div>
              <h1 className="text-lg font-bold text-text">
                Track Your Applications
              </h1>
            </div>

            <button
              onClick={() => handleModal()}
              className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium transition-colors mb-4 ${
                hasAcceptedApplication
                  ? "border border-border text-primary hover:bg-accent/30"
                  : "bg-primary text-white hover:bg-primary-hover"
              }`}
            >
              <Plus className="w-4 h-4" />
              Add Application
            </button>

            <div className="space-y-3 mb-6 pb-6 border-b border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Total</span>
                <span className="font-semibold text-text">
                  {applications.length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Showing</span>
                <span className="font-semibold text-text">
                  {filteredAndSortedApps.length}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
                Filter by status
              </p>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                    statusFilter === "all"
                      ? "bg-primary text-white"
                      : "text-text hover:bg-accent/30"
                  }`}
                >
                  <span>All</span>
                  <span className="text-xs opacity-80">{applications.length}</span>
                </button>
                {Object.entries(statusConfig).map(([status, config]) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                      statusFilter === status
                        ? "bg-primary text-white"
                        : "text-text hover:bg-accent/30"
                    }`}
                  >
                    <span>{config.label}</span>
                    <span className="text-xs opacity-80">
                      {statusCounts[status] || 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                Sort by
              </p>
              <div className="w-full [&_button]:w-full [&_button]:justify-between">
                <SortMenu sortBy={sortBy} onSortChange={setSortBy} />
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col min-w-0">
          <div className="sticky top-0 z-10 flex items-center gap-3 px-4 sm:px-6 py-4 bg-canvas/95 backdrop-blur border-b border-border">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search by company, position, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-surface text-sm text-text placeholder-text-muted focus:outline-none focus:border-primary"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-border flex items-center justify-center hover:bg-accent/30"
                >
                  <X className="w-3 h-3 text-text-muted" />
                </button>
              )}
            </div>
          </div>

          {/* Mobile: Add Application + filters + sort (sidebar hidden) */}
          <div className="lg:hidden px-4 sm:px-6 py-3 border-b border-border bg-canvas space-y-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleModal()}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium shrink-0 ${
                  hasAcceptedApplication
                    ? "border border-border text-primary hover:bg-accent/30"
                    : "bg-primary text-white hover:bg-primary-hover"
                }`}
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
              <div className="flex-1 min-w-0">
                <SortMenu sortBy={sortBy} onSortChange={setSortBy} />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium ${
                  statusFilter === "all"
                    ? "bg-primary text-white"
                    : "bg-surface-alt text-text hover:bg-accent/30"
                }`}
              >
                All
              </button>
              {Object.entries(statusConfig).map(([status, config]) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium ${
                    statusFilter === status
                      ? "bg-primary text-white"
                      : "bg-surface-alt text-text hover:bg-accent/30"
                  }`}
                >
                  {config.label}
                </button>
              ))}
            </div>
          </div>

          {hasAcceptedApplication && !tipDismissed && (
            <div className="mx-4 sm:mx-6 mt-4 rounded-xl border border-border bg-canvas p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text">
                  You&apos;ve accepted an offer. Consider marking other
                  applications as Withdrawn.
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <button
                    onClick={handleMarkAllWithdrawnClick}
                    className="text-sm font-medium text-primary hover:text-primary-hover"
                  >
                    Mark all others as withdrawn
                  </button>
                  <span className="text-text-muted">·</span>
                  <button
                    onClick={dismissTip}
                    className="text-sm text-text-muted hover:text-text"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
              <button
                onClick={dismissTip}
                aria-label="Dismiss tip"
                className="p-1 rounded-lg text-text-muted hover:bg-accent/30 hover:text-text shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {filteredAndSortedApps.length === 0 ? (
            <div className="bg-canvas rounded-2xl border border-border p-12 text-center">
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 rounded-2xl bg-surface-alt flex items-center justify-center">
                  <Briefcase className="w-10 h-10 text-primary/40" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-lg bg-soft-blue/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-soft-blue" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-text mb-2">
                No applications found
              </h3>
              <p className="text-text-muted mb-6 max-w-md mx-auto">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your filters or search query to find what you're looking for"
                  : "Start tracking your internship journey by adding your first application"}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <button
                  onClick={() => handleModal()}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-hover transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add Your First Application
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredAndSortedApps.map((app: Application) => (
                <Card
                  key={app.id}
                  id={app.id}
                  company_name={app.company_name}
                  company_address={app.company_address}
                  position={app.position}
                  date_applied={app.date_applied}
                  status={app.status}
                  notes={app.notes}
                  viewApplication={handleViewApplication}
                  editApplication={handleEditApplication}
                  updateStatus={handleStatusUpdate}
                  deleteApplication={handleDeleteClick}
                  getStatusConfig={getStatusConfig}
                />
              ))}
            </div>
          )}
          </div>
        </main>

        <Modal
          open={open}
          handleModal={handleModal}
          isUpdate={isUpdating}
          setIsCreating={setIsCreating}
          appId={selectedAppId}
          companyName={selectedAppName}
          companyAddress={selectedAppAddress}
        />

        <ConfirmationDialog
          open={deleteDialogOpen}
          onClose={handleDeleteApplication}
          itemName={selectedAppName}
        />

        <ConfirmationDialog
          open={markAllWithdrawnDialogOpen}
          onClose={handleMarkAllWithdrawnConfirm}
          title="Mark all others as withdrawn?"
          description="All applications except your accepted offer will be set to Withdrawn. You can change them later."
          confirmLabel="Mark all withdrawn"
          variant="primary"
        />

        <LoadingOverlay
          open={isDeleting || isUpdating}
          message={isDeleting ? "Deleting application..." : "Updating..."}
        />
      </div>
    </>
  );
}
