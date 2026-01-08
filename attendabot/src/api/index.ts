import express from "express";
import cors from "cors";
import path from "path";
import { authRouter } from "./routes/auth";
import { statusRouter } from "./routes/status";
import { messagesRouter } from "./routes/messages";
import { channelsRouter } from "./routes/channels";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use("/api/auth", authRouter);
app.use("/api/status", statusRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/channels", channelsRouter);

// Serve static frontend files in production
const frontendPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(frontendPath));

// Fallback to index.html for SPA routing
app.get("*", (req, res) => {
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(frontendPath, "index.html"));
  }
});

export function startApiServer(port: number = 3001): void {
  app.listen(port, () => {
    console.log(`API server listening on port ${port}`);
  });
}

export { app };
