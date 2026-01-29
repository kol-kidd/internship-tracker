import { useState, useMemo, useEffect } from "react";
import {
  Search,
  SlidersHorizontal,
  Plus,
  Briefcase,
  Sparkles,
  X,
  Filter,
} from "lucide-react";
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
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [open, setOpen] = useState(false);

  const [selectedAppId, setSelectedAppId] = useState<number>();
  const [selectedAppName, setSelectedAppName] = useState<string>("");
  const [selectedAppAddress, setSelectedAppAddress] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setUpdating] = useState(false);

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
      setUpdating(false);
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
    setUpdating(true);
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
    setUpdating(true);
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
      setUpdating(false);
    }
  };

  const handleViewApplication = (appId: number) => {
    console.log("View application:", appId);
  };

  if (loading && !isDeleting && !isUpdating && !isCreating) {
    return (
      <div className="min-h-screen bg-[#FAFAFF] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-[#7C3AED] to-[#A78BFA] flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-white animate-pulse" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#38BDF8] animate-ping" />
          </div>
          <p className="text-[#1E1B4B]/60">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-[#DDD6FE]/30 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-[#7C3AED] animate-pulse" />
                <span className="text-xs font-medium text-[#7C3AED] uppercase tracking-wider">
                  Applications
                </span>
              </div>
              <h1 className="text-2xl font-bold text-[#1E1B4B]">
                Track Your Applications
              </h1>
              <p className="text-[#1E1B4B]/60 mt-1">
                {applications.length} total applications •{" "}
                {filteredAndSortedApps.length} showing
              </p>
            </div>

            <button
              onClick={() => handleModal()}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-linear-to-r from-[#7C3AED] to-[#A78BFA] text-white text-sm font-medium hover:shadow-lg hover:shadow-[#7C3AED]/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Application
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1E1B4B]/40" />
              <input
                type="text"
                placeholder="Search by company, position, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#DDD6FE]/50 bg-white text-[#1E1B4B] placeholder-[#1E1B4B]/40 focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#DDD6FE]/50 flex items-center justify-center hover:bg-[#DDD6FE] transition-colors"
                >
                  <X className="w-3 h-3 text-[#1E1B4B]/60" />
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                  showFilters
                    ? "bg-[#7C3AED] text-white border-[#7C3AED]"
                    : "border-[#DDD6FE]/50 text-[#1E1B4B] hover:border-[#7C3AED] hover:bg-[#DDD6FE]/20"
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
                {statusFilter !== "all" && (
                  <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
                )}
              </button>

              <SortMenu sortBy={sortBy} onSortChange={setSortBy} />
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-[#FAFAFF] rounded-xl border border-[#DDD6FE]/30">
              <div className="flex items-center gap-2 mb-3">
                <SlidersHorizontal className="w-4 h-4 text-[#7C3AED]" />
                <span className="text-sm font-medium text-[#1E1B4B]">
                  Filter by Status
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    statusFilter === "all"
                      ? "bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/25"
                      : "bg-white border border-[#DDD6FE]/50 text-[#1E1B4B] hover:border-[#7C3AED]"
                  }`}
                >
                  All ({applications.length})
                </button>
                {Object.entries(statusConfig).map(([status, config]) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      statusFilter === status
                        ? "bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/25"
                        : "bg-white border border-[#DDD6FE]/50 text-[#1E1B4B] hover:border-[#7C3AED]"
                    }`}
                  >
                    {config.label} ({statusCounts[status] || 0})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Applications Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredAndSortedApps.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#DDD6FE]/50 p-12 text-center">
            <div className="relative inline-block mb-6">
              <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-[#DDD6FE]/50 to-[#FAFAFF] flex items-center justify-center">
                <Briefcase className="w-10 h-10 text-[#7C3AED]/40" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-lg bg-[#38BDF8]/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#38BDF8]" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-[#1E1B4B] mb-2">
              No applications found
            </h3>
            <p className="text-[#1E1B4B]/60 mb-6 max-w-md mx-auto">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters or search query to find what you're looking for"
                : "Start tracking your internship journey by adding your first application"}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <button
                onClick={() => handleModal()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-linear-to-r from-[#7C3AED] to-[#A78BFA] text-white font-medium hover:shadow-lg hover:shadow-[#7C3AED]/25 transition-all"
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

      <LoadingOverlay open={isDeleting} message="Deleting application..." />
    </div>
  );
}
