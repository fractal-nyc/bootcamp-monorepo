/**
 * @fileoverview Express API server setup. Configures middleware, mounts
 * routes, and serves the frontend in production.
 */

import express from "express";
import cors from "cors";
import path from "path";
import http from "http";
import { authRouter } from "./routes/auth";
import { statusRouter } from "./routes/status";
import { messagesRouter } from "./routes/messages";
import { channelsRouter } from "./routes/channels";
import { usersRouter } from "./routes/users";
import { studentsRouter, cohortsRouter } from "./routes/students";
import { testingRouter } from "./routes/testing";
import { llmRouter } from "./routes/llm";
import { featureRequestsRouter } from "./routes/featureRequests";
import { initializeWebSocket } from "./websocket";

/** Express application instance. */
const app = express();

/** HTTP server instance for WebSocket support. */
const httpServer = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use("/api/auth", authRouter);
app.use("/api/status", statusRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/channels", channelsRouter);
app.use("/api/users", usersRouter);
app.use("/api/students", studentsRouter);
app.use("/api/cohorts", cohortsRouter);
app.use("/api/testing", testingRouter);
app.use("/api/llm", llmRouter);
app.use("/api/feature-requests", featureRequestsRouter);

// Serve static frontend files in production only
if (process.env.NODE_ENV === "production") {
  // __dirname is backend/dist/api when compiled, so go up to attendabot/ then into frontend/dist
  const frontendPath = path.join(__dirname, "../../../frontend/dist");
  app.use(express.static(frontendPath));

  // Fallback to index.html for SPA routing
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(frontendPath, "index.html"));
    }
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
