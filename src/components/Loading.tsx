import React from "react";
import { Backdrop, CircularProgress, Typography, Box } from "@mui/material";

interface LoadingOverlayProps {
  open: boolean;
  message?: string;
  size?: number;
  backdropOpacity?: number;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  open,
  message = "Processing...",
  size = 60,
  backdropOpacity = 0.45,
}) => {
  return (
    <Backdrop
      open={open}
      sx={{
        color: "#fff",
        zIndex: (theme) => theme.zIndex.drawer + 1000,
        backgroundColor: `rgba(0, 0, 0, ${backdropOpacity})`,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
        }}
      >
        <CircularProgress
          size={size}
          thickness={4}
          sx={{
            color: "white",
          }}
        />
        {message && (
          <Typography
            variant="h6"
            sx={{
              fontWeight: 500,
              color: "white",
              textAlign: "center",
            }}
          >
            {message}
          </Typography>
        )}
      </Box>
    </Backdrop>
  );
};

export default LoadingOverlay;
