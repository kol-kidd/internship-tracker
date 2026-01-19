import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  IconButton,
} from "@mui/material";
import { X, AlertTriangle } from "lucide-react";

interface DeleteConfirmationDialogProps {
  open: boolean;
  onClose: (confirmed: boolean) => void;
  title?: string;
  description?: string;
  itemName?: string;
}

export default function ConfirmationDialog({
  open,
  onClose,
  title = "Delete Application",
  description = "Are you sure you want to delete this application? This action cannot be undone.",
  itemName,
}: DeleteConfirmationDialogProps) {
  const handleConfirm = () => {
    onClose(true);
  };

  const handleCancel = () => {
    onClose(false);
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            p: 1,
          },
        },
      }}
    >
      {/* Close Button */}
      <IconButton
        onClick={handleCancel}
        sx={{
          position: "absolute",
          right: 8,
          top: 8,
          color: "grey.500",
          "&:hover": {
            bgcolor: "grey.100",
          },
        }}
      >
        <X size={20} />
      </IconButton>

      {/* Icon */}
      <div className="flex justify-center pt-6 pb-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle size={32} className="text-red-600" />
        </div>
      </div>

      {/* Title */}
      <DialogTitle sx={{ textAlign: "center", pt: 0, pb: 1 }}>
        <Typography sx={{ fontWeight: 600, color: "grey.900" }}>
          {title}
        </Typography>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ textAlign: "center", pb: 2 }}>
        <Typography
          variant="body2"
          sx={{ color: "grey.600", mb: itemName ? 1 : 0 }}
        >
          {description}
        </Typography>
        {itemName && (
          <Typography
            variant="body2"
            sx={{
              color: "grey.900",
              fontWeight: 600,
              bgcolor: "grey.50",
              py: 1,
              px: 2,
              borderRadius: 2,
              mt: 2,
            }}
          >
            {itemName}
          </Typography>
        )}
      </DialogContent>

      {/* Actions */}
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button
          onClick={handleCancel}
          fullWidth
          variant="outlined"
          sx={{
            textTransform: "none",
            fontWeight: 500,
            borderColor: "grey.300",
            color: "grey.700",
            borderRadius: 2,
            "&:hover": {
              borderColor: "grey.400",
              bgcolor: "grey.50",
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          fullWidth
          variant="contained"
          sx={{
            textTransform: "none",
            fontWeight: 500,
            bgcolor: "red",
            borderRadius: 2,
            "&:hover": {
              bgcolor: "#DC2626",
            },
          }}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
