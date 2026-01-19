import { useState, useMemo } from "react";
import {
  Typography,
  TextField,
  InputAdornment,
  Collapse,
  Button,
} from "@mui/material";
import { Search, SlidersHorizontal, Plus } from "lucide-react";
import { useAppStore } from "@/store/applicationStore";
import Card from "@/components/Application/Card";
import SortMenu from "@/components/Dropdown";
import Modal from "@/components/Application/Modal";
import { deleteApplication } from "@/functions/data/deleteApplication";
import { useAuthStore } from "@/store/authStore";
import { Bounce, toast } from "react-toastify";
import ConfirmationDialog from "@/components/Application/ConfirmationDialog";
import LoadingOverlay from "@/components/Loading";
import { updateAppStatus } from "@/functions/data/updateStatus";

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
  | "offer received"
  | "rejected"
  | "accepted"
  | "withdrawn";
type SortByType = "date_desc" | "date_asc" | "company_asc" | "company_desc";

interface StatusConfig {
  color: string;
  label: string;
}

const statusConfig: Record<StatusType, StatusConfig> = {
  applied: {
    color: "bg-blue-100 text-blue-700 border-blue-200",
    label: "Applied",
  },
  interviewing: {
    color: "bg-purple-100 text-purple-700 border-purple-200",
    label: "Interviewing",
  },
  "offer received": {
    color: "bg-green-100 text-green-700 border-green-200",
    label: "Offer Received",
  },
  rejected: {
    color: "bg-red-100 text-red-700 border-red-200",
    label: "Rejected",
  },
  accepted: {
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    label: "Accepted",
  },
  withdrawn: {
    color: "bg-gray-100 text-gray-700 border-gray-200",
    label: "Withdrawn",
  },
};

export default function ApplicationList() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortByType>("date_desc");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [open, setOpen] = useState(false);

  const { applications, loading } = useAppStore();
  const { user } = useAuthStore();

  const [selectedAppId, setSelectedAppId] = useState<number>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAppName, setSelectedAppName] = useState<string>("");
  const [selectedAppAddress, setSelectedAppAddress] = useState<string>("");

  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setUpdating] = useState(false);

  const filteredAndSortedApps = useMemo(() => {
    let filtered = [...applications];

    // Search filter
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

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (app: Application) =>
          app.status.toLowerCase() === statusFilter.toLowerCase(),
      );
    }

    // Sort
    const sorted = [...filtered].sort((a: Application, b: Application) => {
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

    return sorted;
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
    const normalizedStatus = status.toLowerCase() as StatusType;
    return statusConfig[normalizedStatus] || statusConfig.applied;
  };

  const handleViewApplication = (appId: number): void => {
    console.log("View application:", appId);
  };

  const handleEditApplication = (
    appId: number,
    companyName: string,
    companyAddress: string,
  ): void => {
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

  const handleDeleteApplication = async (confirmed: boolean): Promise<void> => {
    console.log("Delete application:", selectedAppId);

    setDeleteDialogOpen(false);
    setIsDeleting(true);
    try {
      if (user && selectedAppId)
        if (confirmed) {
          const { error } = await deleteApplication(user?.id, selectedAppId);

          if (error) {
            toast.error("Delete unsuccessful", {
              position: "top-right",
              hideProgressBar: false,
              closeOnClick: false,
              progress: undefined,
              theme: "light",
              transition: Bounce,
            });

            return;
          }
          toast.success("Delete successful", {
            position: "top-right",
            hideProgressBar: false,
            closeOnClick: false,
            progress: undefined,
            theme: "light",
            transition: Bounce,
          });
        }
    } catch (error) {
      console.error("Error deleting", error);
      toast.error("Delete unsuccessful", {
        position: "top-right",
        hideProgressBar: false,
        closeOnClick: false,
        progress: undefined,
        theme: "light",
        transition: Bounce,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleModal = () => {
    if (open) {
      setUpdating(false);
      setSelectedAppId(undefined);
      setSelectedAppName("");
      setSelectedAppAddress("");
    }
    setOpen(!open);
  };

  const handleStatusUpdate = async (appId: number, newStatus: string) => {
    console.log("new status: ", newStatus);

    try {
      if (user) {
        await updateAppStatus(user.id, appId, newStatus);

        toast.success("Application status updated", {
          position: "top-right",
          hideProgressBar: false,
          closeOnClick: false,
          progress: undefined,
          theme: "light",
          transition: Bounce,
        });
      }
    } catch (error) {
      console.log("Error adding your application: ", error);
      toast.error("Failed to update your application status", {
        position: "top-right",
        hideProgressBar: false,
        closeOnClick: false,
        progress: undefined,
        theme: "light",
        transition: Bounce,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <Typography sx={{ mt: 2, color: "grey.600" }}>
            Loading applications...
          </Typography>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Typography
                variant="h4"
                sx={{ fontWeight: 600, color: "grey.900" }}
              >
                Applications
              </Typography>
              <Typography variant="body2" sx={{ color: "grey.500", mt: 0.5 }}>
                Manage and track your internship applications
              </Typography>
            </div>
            <Button
              variant="contained"
              startIcon={<Plus className="w-4 h-4" />}
              onClick={() => handleModal()}
              sx={{
                bgcolor: "black",
                "&:hover": { bgcolor: "grey.800" },
                textTransform: "none",
                fontWeight: 500,
                borderRadius: 2,
              }}
            >
              Add Application
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <TextField
                fullWidth
                size="small"
                placeholder="Search by company, position, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={20} color="#9CA3AF" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    height: "40px",
                    "&:hover fieldset": {
                      borderColor: "grey.400",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "black",
                      borderWidth: 2,
                    },
                  },
                }}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant={showFilters ? "contained" : "outlined"}
                startIcon={<SlidersHorizontal className="w-4 h-4" />}
                onClick={() => setShowFilters(!showFilters)}
                sx={{
                  textTransform: "none",
                  fontWeight: 500,
                  minWidth: 120,
                  height: "40px",
                  bgcolor: showFilters ? "grey.100" : "white",
                  color: "grey.700",
                  borderColor: "grey.300",
                  borderRadius: 2,
                  "&:hover": {
                    bgcolor: showFilters ? "grey.200" : "grey.50",
                    borderColor: "grey.400",
                  },
                }}
              >
                Filters
              </Button>

              <SortMenu sortBy={sortBy} onSortChange={setSortBy} />
            </div>
          </div>

          {/* Filter Panel */}
          <Collapse in={showFilters}>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, color: "grey.900", mb: 2 }}
              >
                Filter by Status
              </Typography>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={statusFilter === "all" ? "contained" : "outlined"}
                  onClick={() => setStatusFilter("all")}
                  sx={{
                    textTransform: "none",
                    fontWeight: 500,
                    bgcolor: statusFilter === "all" ? "black" : "white",
                    color: statusFilter === "all" ? "white" : "grey.700",
                    borderColor: "grey.300",
                    borderRadius: 2,
                    "&:hover": {
                      bgcolor: statusFilter === "all" ? "grey.800" : "grey.50",
                      borderColor: "grey.400",
                    },
                  }}
                >
                  All ({applications.length})
                </Button>
                {Object.entries(statusConfig).map(([status, config]) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "contained" : "outlined"}
                    onClick={() => setStatusFilter(status)}
                    sx={{
                      textTransform: "none",
                      fontWeight: 500,
                      bgcolor: statusFilter === status ? "black" : "white",
                      color:
                        statusFilter === status
                          ? "white"
                          : config.color.split(" ")[1].replace("text-", ""),
                      borderColor:
                        statusFilter === status
                          ? "black"
                          : config.color.split(" ")[2].replace("border-", ""),
                      borderRadius: 2,
                      "&:hover": {
                        bgcolor:
                          statusFilter === status ? "grey.800" : "transparent",
                        opacity: 0.9,
                      },
                    }}
                  >
                    {config.label} ({statusCounts[status] || 0})
                  </Button>
                ))}
              </div>
            </div>
          </Collapse>
        </div>
      </div>

      {/* Applications Grid/List */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredAndSortedApps.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <Typography
              variant="h6"
              sx={{ fontWeight: 500, color: "grey.900", mb: 1 }}
            >
              No applications found
            </Typography>
            <Typography variant="body2" sx={{ color: "grey.500" }}>
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters or search query"
                : "Start by adding your first internship application"}
            </Typography>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
