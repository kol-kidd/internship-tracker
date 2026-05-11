import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import http from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/auth.routes.js";
import applicationsRoutes from "./routes/application.routes.js";
import journalRoutes from "./routes/journal.routes.js";
import { geminiModel } from "./config/gemini.js";

const app = express();

const normalizeOrigin = (origin) => origin?.replace(/\/+$/, "");
const defaultFrontendOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://internpal.vercel.app",
];
const configuredFrontendOrigins = (
  process.env.FRONTEND_URLS ||
  process.env.FRONTEND_URL ||
  ""
)
  .split(",")
  .map((origin) => normalizeOrigin(origin.trim()))
  .filter(Boolean);
const allowedFrontendOrigins = [
  ...new Set([...configuredFrontendOrigins, ...defaultFrontendOrigins]),
];
const corsOrigin = (origin, callback) => {
  if (!origin || allowedFrontendOrigins.includes(normalizeOrigin(origin))) {
    callback(null, true);
    return;
  }

  callback(new Error(`Origin not allowed by CORS: ${origin}`));
};

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/journal", journalRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.get("/debug/ai-egress", async (req, res) => {
  const debugToken = process.env.DEBUG_OUTBOUND_TOKEN;
  const providedToken = req.get("x-debug-token") || req.query.token;

  if (!debugToken || providedToken !== debugToken) {
    return res.status(404).json({ error: "Route not found" });
  }

  try {
    const ipResponse = await fetch("https://ipinfo.io/json");
    const ipInfo = await ipResponse.json();

    let gemini = { ok: false, error: null };
    try {
      const result = await geminiModel.generateContent("Reply with only: ok");
      const response = await result.response;
      gemini = { ok: true, text: response.text().trim() };
    } catch (error) {
      gemini = {
        ok: false,
        error: error.message,
        status: error.status,
        statusText: error.statusText,
      };
    }

    console.log("AI egress diagnostic:", {
      ip: ipInfo.ip,
      city: ipInfo.city,
      region: ipInfo.region,
      country: ipInfo.country,
      org: ipInfo.org,
      gemini,
    });

    res.json({
      outbound: {
        ip: ipInfo.ip,
        city: ipInfo.city,
        region: ipInfo.region,
        country: ipInfo.country,
        org: ipInfo.org,
      },
      gemini,
    });
  } catch (error) {
    console.error("AI egress diagnostic failed:", error);
    res.status(500).json({
      error: "Failed to run AI egress diagnostic",
      details: error.message,
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Wrap Express in HTTP server for Socket.IO
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: allowedFrontendOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // User joins their personal room
  const joinUserRoom = (userId) => {
    console.log(`User ${userId} joined room`);
    socket.join(userId);
  };

  socket.on("join-user", joinUserRoom);
  socket.on("join-room", joinUserRoom);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Export io for controllers
export { io };

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
