/**
 * @fileoverview WebSocket hook for real-time server log streaming.
 * Handles connection lifecycle, auto-reconnect with backoff, and authentication.
 */

import { useState, useEffect, useRef, useCallback } from "react";

/** Log entry from the server. */
export interface LogEntry {
  id: number;
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
}

/** WebSocket connection states. */
export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

/** WebSocket message types from server. */
interface WsMessage {
  type: "initial" | "log";
  logs?: LogEntry[];
  log?: LogEntry;
}

/** Return type for the useWebSocket hook. */
export interface UseWebSocketResult {
  logs: LogEntry[];
  status: ConnectionStatus;
  clearLogs: () => void;
}

/** Maximum reconnection attempts before giving up. */
const MAX_RECONNECT_ATTEMPTS = 5;

/** Base delay for exponential backoff (ms). */
const BASE_RECONNECT_DELAY = 1000;

/**
 * Hook for connecting to the WebSocket server and receiving logs.
 * @param token - JWT token for authentication.
 * @returns Connection status and log entries.
 */
export function useWebSocket(token: string | null): UseWebSocketResult {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef<number | null>(null);

  /** Clears all accumulated logs. */
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  useEffect(() => {
    if (!token) {
      setStatus("disconnected");
      return;
    }

    /** Connects to the WebSocket server. */
    const connect = () => {
      // Build WebSocket URL (works in both dev and prod)
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws/logs?token=${encodeURIComponent(token)}`;

      setStatus("connecting");
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("connected");
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message: WsMessage = JSON.parse(event.data);
          if (message.type === "initial" && message.logs) {
            setLogs(message.logs);
          } else if (message.type === "log" && message.log) {
            setLogs((prev) => [...prev, message.log!]);
          }
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onclose = () => {
        setStatus("disconnected");
        wsRef.current = null;

        // Attempt reconnection with exponential backoff
        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts.current);
          reconnectAttempts.current++;
          reconnectTimeoutRef.current = window.setTimeout(connect, delay);
        }
      };

      ws.onerror = () => {
        setStatus("error");
      };
    };

    connect();

    // Cleanup on unmount or token change
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [token]);

  return { logs, status, clearLogs };
}
