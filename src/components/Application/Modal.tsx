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
  ref: React.Ref<unknown>
) {
  return <Slide direction="down" ref={ref} {...props} />;
});

const themeColors = {
  canvas: "#ffffff",
  text: "#222222",
  textMuted: "#666666",
  border: "#e6e6e6",
  primary: "#c4946e",
  primaryHover: "#b8855e",
  accent: "#e8d4c4",
};

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    backgroundColor: themeColors.canvas,
    border: `1px solid ${themeColors.border}`,
    borderRadius: 16,
    boxShadow:
      "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
  },
  "& .MuiDialogTitle-root": {
    color: themeColors.text,
    fontWeight: 600,
    fontSize: "1.125rem",
    padding: theme.spacing(2, 3),
    borderBottom: `1px solid ${themeColors.border}`,
  },
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2, 3),
    "&.MuiDialogContent-dividers": {
      borderTop: "none",
    },
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(2, 3),
    borderTop: `1px solid ${themeColors.border}`,
    gap: theme.spacing(1.5),
  },
}));

type ModalProps = {
  handleModal: () => void;
  isUpdate?: boolean;
  setIsCreating?: (value: boolean) => void;
  appId?: number;
  companyName?: string;
  companyAddress?: string;
  position?: string;
  stipend?: "paid" | "unpaid";
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
  const [position, setPosition] = useState("");
  const [stipend, setStipend] = useState<"paid" | "unpaid" | "">("");
  const [dateApplied, setDateApplied] = useState<Dayjs | null>(dayjs());
  const [loadingCreate, setLoadingCreate] = useState(false);

  useEffect(() => {
    if (props.open) {
      if (props.isUpdate && props.companyName && props.companyAddress) {
        setCompanyName(props.companyName);
        setCompanyAddress(props.companyAddress);
        setPosition(props.position ?? "");
        setStipend(props.stipend ?? "");
      } else {
        setCompanyName("");
        setCompanyAddress("");
        setPosition("");
        setStipend("");
        setDateApplied(dayjs());
      }
    }
  }, [
    props.open,
    props.isUpdate,
    props.companyName,
    props.companyAddress,
    props.position,
    props.stipend,
  ]);

  const handleClose = () => {
    setCompanyName("");
    setCompanyAddress("");
    setPosition("");
    setStipend("");
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
        await storeUpdateApplication(props.appId, {
          companyName: companyName,
          companyAddress: companyAddress,
          position: position.trim() || "",
          stipend: stipend === "paid" || stipend === "unpaid" ? stipend : "",
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
          position: position.trim() || "",
          stipend: stipend === "paid" || stipend === "unpaid" ? stipend : "",
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
        }
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
      <DialogTitle sx={{ m: 0, p: 2, pr: 6 }} id="customized-dialog-title">
        {props.isUpdate ? "Edit Application" : "Add New Application"}
      </DialogTitle>
      <IconButton
        aria-label="close"
        onClick={handleClose}
        sx={{
          position: "absolute",
          right: 12,
          top: 12,
          color: themeColors.textMuted,
          "&:hover": {
            backgroundColor: "rgba(232, 212, 196, 0.35)",
            color: themeColors.text,
          },
        }}
      >
        <CircleX className="w-5 h-5" />
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
          label="Role / Position"
          value={position}
          onChange={(e) => {
            setPosition(e.target.value);
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
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#222222]">Stipend</label>
          <select
            value={stipend}
            onChange={(e) =>
              setStipend((e.target.value || "") as "" | "paid" | "unpaid")
            }
            className="w-full rounded-lg border border-[#e6e6e6] bg-white px-3 py-2.5 text-sm text-[#222222] focus:outline-none focus:border-primary"
          >
            <option value="">Not specified</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
          sx={{
            color: themeColors.textMuted,
            textTransform: "none",
            fontWeight: 500,
            "&:hover": {
              backgroundColor: "rgba(232, 212, 196, 0.35)",
              color: themeColors.text,
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
            bgcolor: themeColors.primary,
            color: "#fff",
            textTransform: "none",
            fontWeight: 500,
            "&:hover": {
              bgcolor: themeColors.primaryHover,
            },
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
