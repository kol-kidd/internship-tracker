import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Analytics } from "@vercel/analytics/next";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <App />
        <Analytics />
      </LocalizationProvider>
    </BrowserRouter>
  </StrictMode>,
);
