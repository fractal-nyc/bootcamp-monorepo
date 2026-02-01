/**
 * @fileoverview Log capture service for real-time log streaming.
 * Intercepts console methods and broadcasts logs to WebSocket subscribers.
 */

/** Log entry structure for the ring buffer. */
export interface LogEntry {
  id: number;
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
}

/** Subscriber callback type. */
type LogSubscriber = (entry: LogEntry) => void;

/** Maximum number of log entries to keep in the ring buffer. */
const MAX_BUFFER_SIZE = 500;

/** Number of recent logs to send to new clients. */
const INITIAL_LOGS_COUNT = 100;

/** Ring buffer storing recent log entries. */
const logBuffer: LogEntry[] = [];

/** Set of active subscribers. */
const subscribers = new Set<LogSubscriber>();

/** Counter for unique log IDs. */
let logIdCounter = 0;

/** Original console methods (saved before interception). */
const originalConsole = {
  log: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};

/**
 * Formats arguments into a single string message.
 * @param args - Console arguments to format.
 */
function formatMessage(args: unknown[]): string {
  return args
    .map((arg) => {
      if (typeof arg === "string") return arg;
      if (arg instanceof Error) return `${arg.message}\n${arg.stack}`;
      try {
        return JSON.stringify(arg, null, 2);
      } catch {
        return String(arg);
      }
    })
    .join(" ");
}

/**
 * Adds a log entry to the buffer and broadcasts to subscribers.
 * @param level - Log level (info, warn, error).
 * @param message - Formatted log message.
 */
function addLogEntry(level: LogEntry["level"], message: string): void {
  const entry: LogEntry = {
    id: ++logIdCounter,
    timestamp: new Date().toISOString(),
    level,
    message,
  };

  // Add to ring buffer, removing oldest if at capacity
  logBuffer.push(entry);
  if (logBuffer.length > MAX_BUFFER_SIZE) {
    logBuffer.shift();
  }

  // Broadcast to all subscribers
  subscribers.forEach((callback) => {
    try {
      callback(entry);
    } catch {
      // Ignore subscriber errors
    }
  });
}

/**
 * Intercepts console methods to capture logs.
 * Call this early in application startup.
 */
export function initializeLogger(): void {
  console.log = (...args: unknown[]) => {
    originalConsole.log(...args);
    addLogEntry("info", formatMessage(args));
  };

  console.warn = (...args: unknown[]) => {
    originalConsole.warn(...args);
    addLogEntry("warn", formatMessage(args));
  };

  console.error = (...args: unknown[]) => {
    originalConsole.error(...args);
    addLogEntry("error", formatMessage(args));
  };

  // Log that the logger service has started
  console.log("Logger service initialized");
}

/**
 * Subscribes to new log entries.
 * @param callback - Function called when a new log entry is added.
 * @returns Unsubscribe function.
 */
export function subscribeToLogs(callback: LogSubscriber): () => void {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

/**
 * Returns the most recent log entries for initial client sync.
 * @returns Array of recent log entries.
 */
export function getRecentLogs(): LogEntry[] {
  // Return the last INITIAL_LOGS_COUNT entries
  const startIndex = Math.max(0, logBuffer.length - INITIAL_LOGS_COUNT);
  return logBuffer.slice(startIndex);
}
