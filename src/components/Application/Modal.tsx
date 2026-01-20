import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Slide,
  styled,
  type DialogProps,
} from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import { CircleX } from "lucide-react";
import React, { useEffect, useState } from "react";
import CustomInput from "../Input";
import { useAuthStore } from "@/store/authStore";
import { useAppStore } from "@/store/applicationStore";
import { Bounce, toast } from "react-toastify";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
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

type ModalProps = {
  handleModal: () => void;
  isUpdate?: boolean;
  setIsCreating?: (value: boolean) => void;
  appId?: number;
  companyName?: string;
  companyAddress?: string;
  open: boolean;
};

export default function Modal(props: ModalProps) {
  const { user } = useAuthStore();

  const {
    addApplication: storeAddApplication,
    updateApplication: storeUpdateApplication,
  } = useAppStore();

  const [fullWidth] = useState(true);
  const [maxWidth] = useState<DialogProps["maxWidth"]>("sm");

  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [dateApplied, setDateApplied] = useState<Dayjs | null>(dayjs());
  const [loadingCreate, setLoadingCreate] = useState(false);

  // Reset form when modal opens/closes or when switching between add/edit
  useEffect(() => {
    if (props.open) {
      if (props.isUpdate && props.companyName && props.companyAddress) {
        // Edit mode - populate with existing data
        setCompanyName(props.companyName);
        setCompanyAddress(props.companyAddress);
      } else {
        // Add mode - reset to defaults
        setCompanyName("");
        setCompanyAddress("");
        setDateApplied(dayjs());
      }
    }
  }, [props.open, props.isUpdate, props.companyName, props.companyAddress]);

  const handleClose = () => {
    // Reset form on close
    setCompanyName("");
    setCompanyAddress("");
    setDateApplied(dayjs());
    setLoadingCreate(false);
    props.handleModal();
  };

  const handleSaveApplication = async () => {
    // Validation
    if (
      !companyName ||
      !companyAddress ||
      companyName.trim() === "" ||
      companyAddress.trim() === ""
    ) {
      toast.error("Please fill in all required fields", {
        position: "top-right",
        hideProgressBar: false,
        closeOnClick: false,
        progress: undefined,
        theme: "light",
        transition: Bounce,
      });
      return;
    }

    if (!props.isUpdate && !dateApplied) {
      toast.error("Please select a date", {
        position: "top-right",
        hideProgressBar: false,
        closeOnClick: false,
        progress: undefined,
        theme: "light",
        transition: Bounce,
      });
      return;
    }

    setLoadingCreate(true);
    props.setIsCreating && props.setIsCreating(true);

    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      if (props.isUpdate && props.appId) {
        // Update existing application
        await storeUpdateApplication(props.appId, {
          companyName: companyName,
          companyAddress: companyAddress,
        });

        toast.info("Application updated successfully", {
          position: "top-right",
          hideProgressBar: false,
          closeOnClick: false,
          progress: undefined,
          theme: "light",
          transition: Bounce,
        });
      } else {
        // Create new application
        if (!dateApplied) return;

        await storeAddApplication({
          companyName,
          companyAddress,
          dateApplied: dateApplied.toISOString(),
          status: "applied",
        });

        toast.success("Application added successfully", {
          position: "top-right",
          hideProgressBar: false,
          closeOnClick: false,
          progress: undefined,
          theme: "light",
          transition: Bounce,
        });
      }

      // Close modal and reset form
      handleClose();
    } catch (error) {
      console.error("Error saving application:", error);
      toast.error(
        props.isUpdate
          ? "Failed to update application"
          : "Failed to add application",
        {
          position: "top-right",
          hideProgressBar: false,
          closeOnClick: false,
          progress: undefined,
          theme: "light",
          transition: Bounce,
        },
      );
    } finally {
      setLoadingCreate(false);
    }
  };

  return (
    <BootstrapDialog
      open={props.open}
      slots={{
        transition: Transition,
      }}
      keepMounted
      onClose={handleClose}
      fullWidth={fullWidth}
      maxWidth={maxWidth}
    >
      <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
        {props.isUpdate ? "Edit Application" : "Add New Application"}
      </DialogTitle>
      <IconButton
        aria-label="close"
        onClick={handleClose}
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
        {!props.isUpdate && (
          <DatePicker
            label="Date Applied"
            value={dateApplied}
            onChange={(newValue) => {
              setDateApplied(newValue);
            }}
            maxDate={dayjs()}
          />
        )}

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
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
          sx={{
            color: "grey.600",
            "&:hover": {
              bgcolor: "grey.100",
            },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSaveApplication}
          disabled={loadingCreate}
          sx={{
            bgcolor: "black",
          }}
        >
          {loadingCreate
            ? props.isUpdate
              ? "Updating..."
              : "Saving..."
            : props.isUpdate
              ? "Update Application"
              : "Add Application"}
        </Button>
      </DialogActions>
    </BootstrapDialog>
  );
}
