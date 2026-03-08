import { Dialog, DialogContent, IconButton, Slide } from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import { X, Calendar } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useAppStore } from "@/store/applicationStore";
import { toast } from "react-toastify";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

type ModalProps = {
  handleModal: () => void;
  isUpdate?: boolean;
  appId?: number;
  companyName?: string;
  companyAddress?: string;
  position?: string;
  stipend?: "paid" | "unpaid";
  open: boolean;
};

export default function Modal(props: ModalProps) {
  const {
    addApplication: storeAddApplication,
    updateApplication: storeUpdateApplication,
  } = useAppStore();

  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [position, setPosition] = useState("");
  const [stipend, setStipend] = useState<"paid" | "unpaid" | "">("");
  const [dateApplied, setDateApplied] = useState<Dayjs | null>(dayjs());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (props.open) {
      if (props.isUpdate && props.companyName) {
        setCompanyName(props.companyName);
        setCompanyAddress(props.companyAddress || "");
        setPosition(props.position || "");
        setStipend(props.stipend || "");
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
    props.handleModal();
  };

  const handleSave = async () => {
    if (!companyName || !companyAddress) {
      toast.error("Company name and address are required");
      return;
    }

    setLoading(true);
    try {
      if (props.isUpdate && props.appId) {
        await storeUpdateApplication(props.appId, {
          companyName,
          companyAddress,
          position,
          stipend: stipend === "" ? undefined : stipend,
        });
        toast.success("Application updated");
      } else {
        await storeAddApplication({
          companyName,
          companyAddress,
          position,
          stipend: stipend === "" ? undefined : stipend,
          dateApplied: dateApplied?.toISOString() || dayjs().toISOString(),
          status: "applied",
        });
        toast.success("Application added");
      }
      handleClose();
    } catch {
      toast.error("Failed to save application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={props.open}
      TransitionComponent={Transition}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: "2.5rem",
          overflow: "hidden",
          backgroundImage: "none",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(0, 0, 0, 0.05)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)",
        },
      }}
    >
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight">
              {props.isUpdate ? "Edit Details" : "New Application"}
            </h2>
            <p className="text-sm font-medium text-text-muted">
              {props.isUpdate
                ? "Make sure everything is up to date."
                : "Track another opportunity."}
            </p>
          </div>
          <IconButton
            onClick={handleClose}
            className="bg-black/5 hover:bg-black/10 transition-colors"
          >
            <X size={20} />
          </IconButton>
        </div>

        <DialogContent className="space-y-6 !p-0">
          {!props.isUpdate && (
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted">
                Application Date
              </label>
              <div className="relative">
                <Calendar
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted opacity-40"
                />
                <DatePicker
                  value={dateApplied}
                  onChange={(n) => setDateApplied(n)}
                  sx={{
                    width: "100%",
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "1.25rem",
                      paddingLeft: "2.5rem",
                      backgroundColor: "rgba(0,0,0,0.03)",
                      border: "none",
                      "& fieldset": { border: "none" },
                    },
                  }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted">
                Company Name
              </label>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Apple"
                className="w-full px-5 py-4 rounded-2xl bg-black/5 border-none text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted">
                Position / Role
              </label>
              <input
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="e.g. Software Intern"
                className="w-full px-5 py-4 rounded-2xl bg-black/5 border-none text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-text-muted">
              Location / Address
            </label>
            <input
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              placeholder="e.g. Cupertino, CA"
              className="w-full px-5 py-4 rounded-2xl bg-black/5 border-none text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-text-muted">
              Stipend Status
            </label>
            <div className="flex gap-2">
              {["paid", "unpaid"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStipend(s as "paid" | "unpaid")}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    stipend === s
                      ? "bg-text text-white shadow-lg shadow-black/10 scale-95"
                      : "bg-black/5 text-text-muted hover:bg-black/10"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </DialogContent>

        <div className="flex gap-4 pt-4">
          <button
            onClick={handleClose}
            className="flex-1 py-4 rounded-2xl bg-black/5 text-text-muted text-sm font-bold hover:bg-black/10 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-[2] py-4 rounded-2xl bg-text text-white text-sm font-bold hover:opacity-90 transition-all active:scale-95 shadow-xl shadow-black/10 disabled:opacity-50"
          >
            {loading
              ? "Optimizing..."
              : props.isUpdate
                ? "Verify Changes"
                : "Create Application"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
