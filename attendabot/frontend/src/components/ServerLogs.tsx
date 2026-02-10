/**
 * @fileoverview Server logs component for real-time log viewing.
 * Displays streaming logs with filtering and auto-scroll capabilities.
 */

import { useState, useRef, useEffect } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import type { LogEntry, ConnectionStatus } from "../hooks/useWebSocket";

/** Available log level filters. */
type LogFilter = "all" | "info" | "warn" | "error";

/** Formats a timestamp for display. */
function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** Returns the CSS class for a log level. */
function getLevelClass(level: LogEntry["level"]): string {
  switch (level) {
    case "error":
      return "log-error";
    case "warn":
      return "log-warn";
    default:
      return "log-info";
  }
}

/** Displays the WebSocket connection status. */
function StatusIndicator({ status }: { status: ConnectionStatus }) {
  const statusText = {
    connecting: "Connecting...",
    connected: "Connected",
    disconnected: "Disconnected",
    error: "Connection Error",
  };

  const statusClass = {
    connecting: "status-connecting",
    connected: "status-connected",
    disconnected: "status-disconnected",
    error: "status-error",
  };

  return (
    <span className={`connection-status ${statusClass[status]}`}>
      {statusText[status]}
    </span>
  );
}

/** Real-time server log viewer with filtering and auto-scroll. */
export function ServerLogs() {
  const { logs, status, clearLogs } = useWebSocket();
  const [filter, setFilter] = useState<LogFilter>("all");
  const [autoScroll, setAutoScroll] = useState(true);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Filter logs based on selected level
  const filteredLogs = filter === "all"
    ? logs
    : logs.filter((log) => log.level === filter);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [filteredLogs, autoScroll]);

  // Detect manual scroll to disable auto-scroll
  const handleScroll = () => {
    if (!logsContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = logsContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    if (!isAtBottom && autoScroll) {
      setAutoScroll(false);
    }
  };

  return (
    <div className="panel server-logs">
      <div className="server-logs-header">
        <h2>Server Logs</h2>
        <StatusIndicator status={status} />
      </div>

      <div className="server-logs-controls">
        <div className="log-filter">
          <label htmlFor="log-filter">Filter:</label>
          <select
            id="log-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value as LogFilter)}
          >
            <option value="all">All</option>
            <option value="info">Info</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
          </select>
        </div>

        <label className="auto-scroll-toggle">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
          />
          Auto-scroll
        </label>

        <button onClick={clearLogs} className="clear-logs-btn">
          Clear
        </button>
      </div>

      <div
        className="logs-container"
        ref={logsContainerRef}
        onScroll={handleScroll}
      >
        {filteredLogs.length === 0 ? (
          <div className="no-logs">
            {status === "connected" ? "No logs yet" : "Waiting for connection..."}
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className={`log-entry ${getLevelClass(log.level)}`}>
              <span className="log-timestamp">{formatTimestamp(log.timestamp)}</span>
              <span className={`log-level ${getLevelClass(log.level)}`}>
                [{log.level.toUpperCase()}]
              </span>
              <span className="log-message">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
