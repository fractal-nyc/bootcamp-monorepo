/**
 * @fileoverview WebSocket server for real-time log streaming.
 * Handles client connections, JWT authentication, and log broadcasting.
 */

import { Server as HttpServer, IncomingMessage } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { URL } from "url";
import jwt from "jsonwebtoken";
import { subscribeToLogs, getRecentLogs, LogEntry } from "../services/logger";

/** WebSocket message types sent to clients. */
interface WsMessage {
  type: "initial" | "log";
  logs?: LogEntry[];
  log?: LogEntry;
}

/**
 * Gets the JWT secret from environment variables.
 * Read at runtime to ensure dotenv has been configured.
 */
function getJwtSecret(): string {
  return process.env.JWT_SECRET || "default-secret-change-me";
}

/**
 * Verifies a JWT token from WebSocket query params.
 * @param token - The JWT token to verify.
 * @returns True if the token is valid, false otherwise.
 */
function verifyToken(token: string): boolean {
  try {
    jwt.verify(token, getJwtSecret());
    return true;
  } catch {
    return false;
  }
}

/**
 * Extracts the token from a WebSocket upgrade request URL.
 * @param request - The HTTP upgrade request.
 * @returns The token if present, null otherwise.
 */
function extractToken(request: IncomingMessage): string | null {
  try {
    // Build full URL from request
    const host = request.headers.host || "localhost";
    const protocol = "http";
    const fullUrl = new URL(request.url || "/", `${protocol}://${host}`);
    return fullUrl.searchParams.get("token");
  } catch {
    return null;
  }
}

/**
 * Initializes the WebSocket server and attaches it to the HTTP server.
 * @param httpServer - The HTTP server instance to attach to.
 */
export function initializeWebSocket(httpServer: HttpServer): void {
  const wss = new WebSocketServer({ noServer: true });

  // Handle WebSocket upgrade requests
  httpServer.on("upgrade", (request, socket, head) => {
    const url = request.url || "";

    // Only handle /ws/logs path
    if (!url.startsWith("/ws/logs")) {
      socket.destroy();
      return;
    }

    // Extract and verify token
    const token = extractToken(request);
    if (!token || !verifyToken(token)) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    // Upgrade connection
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });

  // Handle new WebSocket connections
  wss.on("connection", (ws: WebSocket) => {
    console.log("WebSocket client connected");

    // Send initial batch of recent logs
    const initialLogs = getRecentLogs();
    const initialMessage: WsMessage = {
      type: "initial",
      logs: initialLogs,
    };
    ws.send(JSON.stringify(initialMessage));

    // Subscribe to new logs
    const unsubscribe = subscribeToLogs((entry: LogEntry) => {
      if (ws.readyState === WebSocket.OPEN) {
        const logMessage: WsMessage = {
          type: "log",
          log: entry,
        };
        ws.send(JSON.stringify(logMessage));
      }
    });

    // Clean up on disconnect
    ws.on("close", () => {
      console.log("WebSocket client disconnected");
      unsubscribe();
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      unsubscribe();
    });
  });

  console.log("WebSocket server initialized on /ws/logs");
}
