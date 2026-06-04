import { Dialog, DialogContent, IconButton, Slide } from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import { X, Calendar } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useAppStore, type Application, type ApplicationPriority } from "@/store/applicationStore";
import { toast } from "react-toastify";
import { toDateInputValue } from "@/lib/dateInput";

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
  application?: Application | null;
  open: boolean;
};

const priorityOptions: { value: ApplicationPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
];

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

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
  const [applicationUrl, setApplicationUrl] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [priority, setPriority] = useState<ApplicationPriority>("normal");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [supervisorName, setSupervisorName] = useState("");
  const [supervisorEmail, setSupervisorEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (props.open) {
      const app = props.application;
      if (props.isUpdate && app) {
        setCompanyName(app.company_name);
        setCompanyAddress(app.company_address || "");
        setPosition(app.position || "");
        setStipend(app.stipend || "");
        setApplicationUrl(app.application_url || "");
        setContactName(app.contact_name || "");
        setContactEmail(app.contact_email || "");
        setDeadlineDate(toDateInputValue(app.deadline_date));
        setInterviewDate(toDateInputValue(app.interview_date));
        setFollowUpDate(toDateInputValue(app.follow_up_date));
        setPriority(app.priority || "normal");
        setStartDate(toDateInputValue(app.start_date));
        setEndDate(toDateInputValue(app.end_date));
        setSupervisorName(app.supervisor_name || "");
        setSupervisorEmail(app.supervisor_email || "");
        setDepartment(app.department || "");
      } else {
        setCompanyName("");
        setCompanyAddress("");
        setPosition("");
        setStipend("");
        setDateApplied(dayjs());
        setApplicationUrl("");
        setContactName("");
        setContactEmail("");
        setDeadlineDate("");
        setInterviewDate("");
        setFollowUpDate("");
        setPriority("normal");
        setStartDate("");
        setEndDate("");
        setSupervisorName("");
        setSupervisorEmail("");
        setDepartment("");
      }
    }
  }, [
    props.open,
    props.isUpdate,
    props.application,
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
      const payload = {
        companyName,
        companyAddress,
        position,
        stipend: stipend === "" ? undefined : stipend,
        applicationUrl: emptyToNull(applicationUrl),
        contactName: emptyToNull(contactName),
        contactEmail: emptyToNull(contactEmail),
        deadlineDate: emptyToNull(deadlineDate),
        interviewDate: emptyToNull(interviewDate),
        followUpDate: emptyToNull(followUpDate),
        priority,
        startDate: emptyToNull(startDate),
        endDate: emptyToNull(endDate),
        supervisorName: emptyToNull(supervisorName),
        supervisorEmail: emptyToNull(supervisorEmail),
        department: emptyToNull(department),
      };

      if (props.isUpdate && props.application) {
        await storeUpdateApplication(props.application.id, payload);
        toast.success("Application updated");
      } else {
        await storeAddApplication({
          ...payload,
          companyName,
          companyAddress,
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
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: "1rem",
          overflow: "hidden",
          backgroundImage: "none",
          backgroundColor: "var(--color-canvas)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 8px 18px rgba(16, 24, 40, 0.08)",
        },
      }}
    >
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight">
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
              <label className="text-xs font-medium text-text-muted">
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
                      borderRadius: "0.75rem",
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
              <label className="text-xs font-medium text-text-muted">
                Company Name
              </label>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Apple"
                className="w-full px-4 py-3 rounded-lg bg-surface border border-border text-sm focus:ring-2 focus:ring-primary/10 transition-colors outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-text-muted">
                Position / Role
              </label>
              <input
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="e.g. Software Intern"
                className="w-full px-4 py-3 rounded-lg bg-surface border border-border text-sm focus:ring-2 focus:ring-primary/10 transition-colors outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-text-muted">
              Location / Address
            </label>
            <input
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              placeholder="e.g. Cupertino, CA"
              className="w-full px-4 py-3 rounded-lg bg-surface border border-border text-sm focus:ring-2 focus:ring-primary/10 transition-colors outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-text-muted">
              Stipend Status
            </label>
            <div className="flex gap-2">
              {["paid", "unpaid"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStipend(s as "paid" | "unpaid")}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    stipend === s
                      ? "bg-primary text-white"
                      : "bg-black/5 text-text-muted hover:bg-black/10"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="mb-3 text-sm font-semibold text-text">
              Next action
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-muted">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as ApplicationPriority)}
                  className="w-full rounded-lg border border-border bg-canvas px-3 py-3 text-sm text-text outline-none transition-colors focus:ring-2 focus:ring-primary/10"
                >
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-muted">
                  Follow-up Date
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full rounded-lg border border-border bg-canvas px-3 py-3 text-sm text-text outline-none transition-colors focus:ring-2 focus:ring-primary/10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-muted">
                  Deadline
                </label>
                <input
                  type="date"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  className="w-full rounded-lg border border-border bg-canvas px-3 py-3 text-sm text-text outline-none transition-colors focus:ring-2 focus:ring-primary/10"
                />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-muted">
                  Interview Date
                </label>
                <input
                  type="date"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="w-full rounded-lg border border-border bg-canvas px-3 py-3 text-sm text-text outline-none transition-colors focus:ring-2 focus:ring-primary/10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-muted">
                  Application Link
                </label>
                <input
                  value={applicationUrl}
                  onChange={(e) => setApplicationUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-border bg-canvas px-3 py-3 text-sm text-text outline-none transition-colors focus:ring-2 focus:ring-primary/10"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="mb-3 text-sm font-semibold text-text">
              Contacts and internship details
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-muted">
                  Contact Name
                </label>
                <input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Recruiter or HR contact"
                  className="w-full rounded-lg border border-border bg-canvas px-3 py-3 text-sm text-text outline-none transition-colors focus:ring-2 focus:ring-primary/10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-muted">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="contact@example.com"
                  className="w-full rounded-lg border border-border bg-canvas px-3 py-3 text-sm text-text outline-none transition-colors focus:ring-2 focus:ring-primary/10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-muted">
                  Department
                </label>
                <input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. IT Department"
                  className="w-full rounded-lg border border-border bg-canvas px-3 py-3 text-sm text-text outline-none transition-colors focus:ring-2 focus:ring-primary/10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-muted">
                  Supervisor Name
                </label>
                <input
                  value={supervisorName}
                  onChange={(e) => setSupervisorName(e.target.value)}
                  placeholder="On-site supervisor"
                  className="w-full rounded-lg border border-border bg-canvas px-3 py-3 text-sm text-text outline-none transition-colors focus:ring-2 focus:ring-primary/10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-muted">
                  Supervisor Email
                </label>
                <input
                  type="email"
                  value={supervisorEmail}
                  onChange={(e) => setSupervisorEmail(e.target.value)}
                  placeholder="supervisor@example.com"
                  className="w-full rounded-lg border border-border bg-canvas px-3 py-3 text-sm text-text outline-none transition-colors focus:ring-2 focus:ring-primary/10"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-muted">
                    Start
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-border bg-canvas px-3 py-3 text-sm text-text outline-none transition-colors focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-text-muted">
                    End
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-lg border border-border bg-canvas px-3 py-3 text-sm text-text outline-none transition-colors focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>
            </div>
          </div>
        </DialogContent>

        <div className="flex gap-4 pt-4">
          <button
            onClick={handleClose}
            className="flex-1 py-3 rounded-lg bg-surface text-text-muted text-sm font-semibold hover:bg-border transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-[2] py-3 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {loading
              ? "Saving..."
              : props.isUpdate
                ? "Update Application"
                : "Create Application"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
