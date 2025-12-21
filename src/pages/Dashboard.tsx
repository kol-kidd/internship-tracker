import { addApplication } from "@/functions/data/addApplication";
import { useAuthStore } from "@/store/authStore";
import Dialog, { type DialogProps } from "@mui/material/Dialog";
import React, { useEffect, useState } from "react";

import type { TransitionProps } from "@mui/material/transitions";
import { styled } from "@mui/material/styles";
import Slide from "@mui/material/Slide";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import { CircleX } from "lucide-react";
import CustomInput from "@/components/Input";
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
import { Bounce, toast } from "react-toastify";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="down" ref={ref} {...props} />;
});

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));

export default function Dashboard() {
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [dateApplied, setDateApplied] = useState<Dayjs | null>(dayjs());
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  const [fullWidth] = React.useState(true);
  const [maxWidth] = React.useState<DialogProps["maxWidth"]>("sm");

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

  // const statusOptions = [
  //   "Applied",
  //   "Interviewing",
  //   "Offer Received",
  //   "Hired",
  //   "Not selected by employer",
  //   "No longer interested",
  // ];

  const { user } = useAuthStore();

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (loading) {
      setProgress(0); // reset
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

  const handleCreateApplication = async () => {
    try {
      if (
        !companyName ||
        !companyAddress ||
        companyName.trim() === "" ||
        companyAddress.trim() === "" ||
        !dateApplied
      ) {
        return;
      }

      if (user && dateApplied) {
        await addApplication(
          user.id,
          dateApplied.toDate(),
          companyName,
          companyAddress,
          "applied"
        );

        toast.success("Application saved", {
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
      toast.error("Failed to save your application", {
        position: "top-right",
        hideProgressBar: false,
        closeOnClick: false,
        progress: undefined,
        theme: "light",
        transition: Bounce,
      });
    } finally {
      handleModal();
      setCompanyAddress("");
      setCompanyName("");
      setDateApplied(dayjs());
    }
  };

  const handleModal = () => {
    setOpen(!open);
  };

  // console.log(applications)

  return (
    <div className="h-full bg-gray-50 px-6 py-3">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Welcome back</h1>
          <p className="text-sm text-gray-500 mt-1">
            Here’s a snapshot of your internship search
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
          <button className="px-5 py-3 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100">
            View All Applications
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Applications
              </h2>
              <span className="text-sm text-gray-500 cursor-pointer hover:underline">
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
                    {applications.slice(0, 5).map((row, index) => (
                      <TableRow key={index}>
                        <TableCell component="th" scope="row">
                          {index + 1}
                        </TableCell>
                        <TableCell align="right">{row.company_name}</TableCell>
                        <TableCell align="right">
                          {row.company_address}
                        </TableCell>
                        <TableCell align="right">
                          {dayjs(row.date_applied).format("MMM DD, YYYY")}
                        </TableCell>
                        <TableCell align="right" className="capitalize">
                          <Chip color="success" label={row.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <div className="text-center py-12">
                <p className="text-sm text-gray-500">
                  You haven’t added any internships yet.
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

      <BootstrapDialog
        open={open}
        slots={{
          transition: Transition,
        }}
        keepMounted
        onClose={handleModal}
        fullWidth={fullWidth}
        maxWidth={maxWidth}
        // aria-describedby="alert-dialog-slide-description"
      >
        <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
          Internship
        </DialogTitle>
        <IconButton
          aria-label="close"
          onClick={handleModal}
          sx={(theme) => ({
            position: "absolute",
            right: 8,
            top: 8,
            color: theme.palette.grey[500],
          })}
        >
          <CircleX />
        </IconButton>
        <DialogContent dividers className="flex flex-col gap-3">
          <DatePicker
            label="Date Applied"
            value={dateApplied}
            onChange={(newValue) => {
              setDateApplied(newValue);
            }}
            maxDate={dayjs()}
          />

          <CustomInput
            type="text"
            variant="outlined"
            label="Company Name"
            value={companyName}
            onChange={(e) => {
              setCompanyName(e.target.value);
            }}
          />
          <CustomInput
            type="text"
            variant="outlined"
            label="Company Address"
            value={companyAddress}
            onChange={(e) => {
              setCompanyAddress(e.target.value);
            }}
          />

          {/* <FormControl>
            <FormLabel id="demo-row-radio-buttons-group-label">
              Status
            </FormLabel>
            <RadioGroup
              row
              aria-labelledby="demo-row-radio-buttons-group-label"
              name="row-radio-buttons-group"
            >
              {statusOptions.map((item) => (
                <FormControlLabel
                  id="item"
                  value={item}
                  control={<Radio />}
                  label={item}
                />
              ))}
            </RadioGroup>
          </FormControl> */}
        </DialogContent>
        <DialogActions>
          <Button
            autoFocus
            onClick={handleCreateApplication}
            disabled={loading}
          >
            {loading ? "SAVING...." : "SAVE CHANGES"}
          </Button>
        </DialogActions>
      </BootstrapDialog>
    </div>
  );
}
