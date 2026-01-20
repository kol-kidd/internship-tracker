import * as React from "react";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import {
  EllipsisVertical,
  Check,
  Send,
  UserCheck,
  Gift,
  XCircle,
  CheckCircle,
  Ban,
} from "lucide-react";

const statusOptions = [
  { value: "applied", label: "Applied", icon: Send, color: "#3B82F6" },
  {
    value: "interviewing",
    label: "Interviewing",
    icon: UserCheck,
    color: "#8B5CF6",
  },
  {
    value: "offer",
    label: "Offer received",
    icon: Gift,
    color: "#10B981",
  },
  { value: "rejected", label: "Rejected", icon: XCircle, color: "#EF4444" },
  { value: "accepted", label: "Accepted", icon: CheckCircle, color: "#059669" },
  { value: "withdrawn", label: "Withdrawn", icon: Ban, color: "#6B7280" },
];

const ITEM_HEIGHT = 48;

type LongMenuProps = {
  currentStatus: string;
  onStatusChange: (newStatus: string) => void;
};

export default function LongMenu({
  currentStatus,
  onStatusChange,
}: LongMenuProps) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleStatusSelect = (status: string) => {
    onStatusChange(status);
    handleClose();
  };

  return (
    <div>
      <IconButton
        aria-label="change status"
        id="status-menu-button"
        aria-controls={open ? "status-menu" : undefined}
        aria-expanded={open ? "true" : undefined}
        aria-haspopup="true"
        onClick={handleClick}
      >
        <EllipsisVertical className="w-5 h-5" />
      </IconButton>
      <Menu
        id="status-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            style: {
              maxHeight: ITEM_HEIGHT * 4.5,
              width: "240px",
              borderRadius: "12px",
              boxShadow:
                "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
            },
          },
          list: {
            "aria-labelledby": "status-menu-button",
            sx: { py: 1 },
          },
        }}
      >
        {statusOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = option.value === currentStatus.toLowerCase();

          return (
            <MenuItem
              key={option.value}
              selected={isSelected}
              onClick={() => handleStatusSelect(option.value)}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                px: 2,
                py: 1.5,
                mx: 0.5,
                borderRadius: "8px",
                gap: 1.5,
                "&.Mui-selected": {
                  backgroundColor: `${option.color}15`,
                  "&:hover": {
                    backgroundColor: `${option.color}25`,
                  },
                },
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                },
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  flex: 1,
                }}
              >
                <Icon
                  className="w-4 h-4"
                  style={{ color: isSelected ? option.color : "#6B7280" }}
                />
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: isSelected ? 500 : 400,
                    color: isSelected ? option.color : "#374151",
                  }}
                >
                  {option.label}
                </span>
              </div>
              {isSelected && (
                <Check className="w-4 h-4" style={{ color: option.color }} />
              )}
            </MenuItem>
          );
        })}
      </Menu>
    </div>
  );
}
