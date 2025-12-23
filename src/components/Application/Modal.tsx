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
import React, { useState } from "react";
import CustomInput from "../Input";
import { useAuthStore } from "@/store/authStore";
import { addApplication } from "@/functions/data/addApplication";
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

type ModalProps = {
  handleModal: () => void;
  open: boolean;
};

export default function Modal(props: ModalProps) {
  const { user } = useAuthStore();

  const [fullWidth] = useState(true);
  const [maxWidth] = useState<DialogProps["maxWidth"]>("sm");

  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [dateApplied, setDateApplied] = useState<Dayjs | null>(dayjs());
  const [loadingCreate, setLoadingCreate] = useState(false);

  const handleCreateApplication = async () => {
    setLoadingCreate(true);
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
      props.handleModal();
      setCompanyAddress("");
      setCompanyName("");
      setDateApplied(dayjs());
      setLoadingCreate(true);
    }
  };
  return (
    <BootstrapDialog
      open={props.open}
      slots={{
        transition: Transition,
      }}
      keepMounted
      onClose={props.handleModal}
      fullWidth={fullWidth}
      maxWidth={maxWidth}
      // aria-describedby="alert-dialog-slide-description"
    >
      <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
        Internship
      </DialogTitle>
      <IconButton
        aria-label="close"
        onClick={props.handleModal}
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
      </DialogContent>
      <DialogActions>
        <Button
          autoFocus
          onClick={handleCreateApplication}
          disabled={loadingCreate}
        >
          {loadingCreate ? "SAVING...." : "SAVE CHANGES"}
        </Button>
      </DialogActions>
    </BootstrapDialog>
  );
}
