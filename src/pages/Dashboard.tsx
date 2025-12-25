import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useAppStore } from "@/store/applicationStore";
import TableContainer from "@mui/material/TableContainer";
import Paper from "@mui/material/Paper";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Skeleton from "@mui/material/Skeleton";
import { useNavigate } from "react-router-dom";
import Modal from "@/components/Application/Modal";

type StatusType =
  | "applied"
  | "interviewing"
  | "offer received"
  | "rejected"
  | "accepted"
  | "withdrawn";

interface StatusConfig {
  label: string;
  color: { bg: string; text: string; border: string };
}

const statusConfig: Record<StatusType, StatusConfig> = {
  applied: {
    label: "Applied",
    color: { bg: "#EFF6FF", text: "#1E40AF", border: "#BFDBFE" },
  },
  interviewing: {
    label: "Interviewing",
    color: { bg: "#F3E8FF", text: "#6B21A8", border: "#D8B4FE" },
  },
  "offer received": {
    label: "Offer Received",
    color: { bg: "#D1FAE5", text: "#065F46", border: "#A7F3D0" },
  },
  rejected: {
    label: "Rejected",
    color: { bg: "#FEE2E2", text: "#991B1B", border: "#FECACA" },
  },
  accepted: {
    label: "Accepted",
    color: { bg: "#D1FAE5", text: "#065F46", border: "#6EE7B7" },
  },
  withdrawn: {
    label: "Withdrawn",
    color: { bg: "#F3F4F6", text: "#374151", border: "#D1D5DB" },
  },
};

const getStatusConfig = (status: string): StatusConfig => {
  const normalizedStatus = status.toLowerCase() as StatusType;
  return statusConfig[normalizedStatus] || statusConfig.applied;
};

export default function Dashboard() {
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  const navigate = useNavigate();

  const { applications, loading } = useAppStore();

  const applicationsCount = applications.length;
  const inProgressCount = applications.filter(
    (app) => app.status.toLowerCase() === "applied"
  ).length;
  const interviewsCount = applications.filter(
    (app) => app.status.toLowerCase() === "interviewing"
  ).length;
  const offersCount = applications.filter(
    (app) => app.status.toLowerCase() === "offer received"
  ).length;

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (loading) {
      setProgress(0);
      timer = setInterval(() => {
        setProgress((oldProgress) => {
          if (oldProgress >= 90) return oldProgress;
          return oldProgress + 10;
        });
      }, 200);
    } else {
      setProgress(100);
    }

    return () => clearInterval(timer);
  }, [loading]);

  const handleModal = () => {
    setOpen(!open);
  };

  return (
    <div className="h-full bg-gray-50 px-6 py-3">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Welcome back</h1>
          <p className="text-sm text-gray-500 mt-1">
            Here's a snapshot of your internship search
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Applications", value: applicationsCount },
            { label: "In Progress", value: inProgressCount },
            { label: "Interviews", value: interviewsCount },
            { label: "Offers", value: offersCount },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-3xl font-semibold text-gray-900 mt-2">
                {loading ? (
                  <CircularProgress variant="determinate" value={progress} />
                ) : (
                  stat.value
                )}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleModal}
            className="px-5 py-3 rounded-lg bg-black text-white text-sm font-medium hover:bg-gray-900"
          >
            + Add Internship
          </button>
          <button
            onClick={() => navigate("/applications")}
            className="px-5 py-3 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            View All Applications
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Applications
              </h2>
              <span
                onClick={() => navigate("/applications")}
                className="text-sm text-gray-500 cursor-pointer hover:underline"
              >
                View all
              </span>
            </div>

            {loading ? (
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell align="right">Company Name</TableCell>
                      <TableCell align="right">Address</TableCell>
                      <TableCell align="right">Date Applied</TableCell>
                      <TableCell align="right">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Skeleton variant="text" />
                        </TableCell>
                        <TableCell align="right">
                          <Skeleton variant="text" />
                        </TableCell>
                        <TableCell align="right">
                          <Skeleton variant="text" />
                        </TableCell>
                        <TableCell align="right">
                          <Skeleton variant="text" />
                        </TableCell>
                        <TableCell align="right">
                          <Skeleton variant="text" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : applications.length > 0 ? (
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell align="right">Company Name</TableCell>
                      <TableCell align="right">Address</TableCell>
                      <TableCell align="right">Date Applied</TableCell>
                      <TableCell align="right">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {applications.slice(0, 5).map((row, index) => {
                      const statusData = getStatusConfig(row.status);
                      return (
                        <TableRow key={index}>
                          <TableCell component="th" scope="row">
                            {index + 1}
                          </TableCell>
                          <TableCell align="right">
                            {row.company_name}
                          </TableCell>
                          <TableCell align="right">
                            {row.company_address}
                          </TableCell>
                          <TableCell align="right">
                            {dayjs(row.date_applied).format("MMM DD, YYYY")}
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={statusData.label}
                              size="small"
                              sx={{
                                backgroundColor: statusData.color.bg,
                                color: statusData.color.text,
                                border: `1px solid ${statusData.color.border}`,
                                fontWeight: 500,
                                fontSize: "0.75rem",
                                height: "28px",
                                "& .MuiChip-label": {
                                  px: 1.5,
                                },
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <div className="text-center py-12">
                <p className="text-sm text-gray-500">
                  You haven't added any internships yet.
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Start tracking to see them here.
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Needs Attention
            </h2>

            <div className="text-sm text-gray-500">
              <p>No urgent tasks right now</p>
              <p className="text-gray-400 mt-1">
                Interviews and deadlines will appear here.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Modal open={open} handleModal={handleModal} />
    </div>
  );
}
