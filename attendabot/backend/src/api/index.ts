/**
 * @fileoverview Express API server setup. Configures middleware, mounts
 * routes, and serves the frontend in production.
 */

import express from "express";
import cors from "cors";
import path from "path";
import http from "http";
import { toNodeHandler } from "better-auth/node";
import { auth } from "../auth";
import { authenticateToken } from "./middleware/auth";
import { requireInstructor } from "./middleware/requireInstructor";
import { statusRouter } from "./routes/status";
import { messagesRouter } from "./routes/messages";
import { channelsRouter } from "./routes/channels";
import { usersRouter } from "./routes/users";
import { studentsRouter, cohortsRouter } from "./routes/students";
import { testingRouter } from "./routes/testing";
import { llmRouter } from "./routes/llm";
import { featureRequestsRouter } from "./routes/featureRequests";
import { featureFlagsRouter } from "./routes/featureFlags";
import { observersRouter } from "./routes/observers";
import { databaseRouter } from "./routes/database";
import { meRouter } from "./routes/me";
import { studentPortalRouter } from "./routes/studentPortal";
import { initializeWebSocket } from "./websocket";

/** Express application instance. */
const app = express();

/** HTTP server instance for WebSocket support. */
const httpServer = http.createServer(app);

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", process.env.BETTER_AUTH_URL || "http://localhost:3001"],
  credentials: true,
}));

// BetterAuth handler must be mounted before express.json()
app.all("/api/auth/better/*", toNodeHandler(auth));

app.use(express.json({ limit: "10mb" }));

// Routes accessible by both roles (auth handled inside router)
app.use("/api/auth/me", meRouter);

// Student-only routes (auth + role check handled inside router)
app.use("/api/student-portal", studentPortalRouter);

// Admin/instructor-only routes
// authenticateToken sets req.user (with role), then requireInstructor checks it.
// Each router also calls authenticateToken internally, but it short-circuits if already set.
app.use("/api/status", authenticateToken, requireInstructor, statusRouter);
app.use("/api/messages", authenticateToken, requireInstructor, messagesRouter);
app.use("/api/channels", authenticateToken, requireInstructor, channelsRouter);
app.use("/api/users", authenticateToken, requireInstructor, usersRouter);
app.use("/api/students", authenticateToken, requireInstructor, studentsRouter);
app.use("/api/cohorts", authenticateToken, requireInstructor, cohortsRouter);
app.use("/api/testing", authenticateToken, requireInstructor, testingRouter);
app.use("/api/llm", authenticateToken, requireInstructor, llmRouter);
app.use("/api/feature-requests", authenticateToken, requireInstructor, featureRequestsRouter);
app.use("/api/feature-flags", authenticateToken, requireInstructor, featureFlagsRouter);
app.use("/api/observers", authenticateToken, requireInstructor, observersRouter);
app.use("/api/database", authenticateToken, requireInstructor, databaseRouter);

// Serve static frontend files in production only
if (process.env.NODE_ENV === "production") {
  // __dirname is backend/dist/api when compiled, so go up to attendabot/ then into frontend/dist
  const frontendPath = path.join(__dirname, "../../../frontend/dist");

  app.use(express.static(frontendPath));

  // Fallback: serve index.html for all non-API routes (SPA routing)
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api")) return;
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

/**
 * Starts the Express API server on the specified port.
 * Initializes WebSocket support for real-time log streaming.
 * @param port - Port number to listen on.
 */
export function startApiServer(port: number = 3001): void {
  // Initialize WebSocket server before starting
  initializeWebSocket(httpServer);

  httpServer.listen(port, () => {
    console.log(`API server listening on port ${port}`);
  });
}

export { app };
