import { addApplication } from "@/functions/data/addApplication";
import { useAuthStore } from "@/store/authStore";
import Dialog from "@mui/material/Dialog";
import React, { useState } from "react";

import type { TransitionProps } from "@mui/material/transitions";
import { styled } from "@mui/material/styles";
import Slide from "@mui/material/Slide";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import { CircleX } from "lucide-react";

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
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const { user } = useAuthStore();

  const handleCreateApplication = async () => {
    setLoading(true);
    console.log("user: ", user);

    try {
      if (
        !companyName ||
        !companyAddress ||
        companyName.trim() === "" ||
        companyAddress.trim() === "" ||
        status
      ) {
        setLoading(false);
        return;
      }

      if (user) {
        await addApplication(user.id, companyName, companyAddress, status);
      }
    } catch (error) {
      console.log("Error adding your application: ", error);
    }
  };

  const handleModal = () => {
    setOpen(!open);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Welcome back</h1>
          <p className="text-sm text-gray-500 mt-1">
            Here’s a snapshot of your internship search
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Applications", value: 0 },
            { label: "In Progress", value: 0 },
            { label: "Interviews", value: 0 },
            { label: "Offers", value: 0 },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-3xl font-semibold text-gray-900 mt-2">
                {stat.value}
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

            <div className="text-center py-12">
              <p className="text-sm text-gray-500">
                You haven’t added any internships yet.
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Start tracking to see them here.
              </p>
            </div>
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
        // aria-describedby="alert-dialog-slide-description"
      >
        <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
          Modal title
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
        <DialogContent dividers>
          <Typography gutterBottom>
            Cras mattis consectetur purus sit amet fermentum. Cras justo odio,
            dapibus ac facilisis in, egestas eget quam. Morbi leo risus, porta
            ac consectetur ac, vestibulum at eros.
          </Typography>
          <Typography gutterBottom>
            Praesent commodo cursus magna, vel scelerisque nisl consectetur et.
            Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor
            auctor.
          </Typography>
          <Typography gutterBottom>
            Aenean lacinia bibendum nulla sed consectetur. Praesent commodo
            cursus magna, vel scelerisque nisl consectetur et. Donec sed odio
            dui. Donec ullamcorper nulla non metus auctor fringilla.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={handleModal}>
            Save changes
          </Button>
        </DialogActions>
      </BootstrapDialog>
    </div>
  );
}
