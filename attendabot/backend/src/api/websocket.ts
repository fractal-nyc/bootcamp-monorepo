/**
 * @fileoverview WebSocket server for real-time log streaming.
 * Handles client connections, BetterAuth session authentication, and log broadcasting.
 */

import { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth";
import { subscribeToLogs, getRecentLogs, LogEntry } from "../services/logger";

/** WebSocket message types sent to clients. */
interface WsMessage {
  type: "initial" | "log";
  logs?: LogEntry[];
  log?: LogEntry;
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

    // Verify BetterAuth session (cookie-based)
    auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    }).then((session) => {
      if (session?.user) {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit("connection", ws, request);
        });
      } else {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
      }
    }).catch(() => {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
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
