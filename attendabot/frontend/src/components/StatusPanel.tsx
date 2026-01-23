/**
 * @fileoverview Status panel component showing bot stats and scheduled jobs.
 */

import { useEffect, useState } from "react";
import { getStatus } from "../api/client";
import type { BotStatus } from "../api/client";

/** Converts a cron expression to 12-hour time format (e.g., "9:45 AM ET"). */
function cronToTime(cron: string): string {
  const parts = cron.split(" ");
  if (parts.length < 2) return cron;

  const minute = parseInt(parts[0], 10);
  const hour = parseInt(parts[1], 10);

  if (isNaN(minute) || isNaN(hour)) return cron;

  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const minuteStr = minute.toString().padStart(2, "0");

  return `${hour12}:${minuteStr} ${period} ET`;
}

/** Formats milliseconds as a human-readable duration string. */
function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/** Displays bot connection status, stats, and scheduled job information. */
export function StatusPanel() {
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchStatus = async () => {
      const data = await getStatus();
      if (!isMounted) return;

      if (data) {
        setStatus(data);
        setError(null);
      } else {
        setError("Failed to fetch status");
      }
      setLoading(false);
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    const data = await getStatus();
    if (data) {
      setStatus(data);
      setError(null);
    } else {
      setError("Failed to fetch status");
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="panel">Loading status...</div>;
  }

  if (error || !status) {
    return <div className="panel error">{error || "No status available"}</div>;
  }

  return (
    <div className="panel status-panel">
      <h2>Bot Status</h2>

      <div className="status-grid">
        <div className="status-item">
          <span className="label">Discord</span>
          <span className={`value ${status.discordConnected ? "connected" : "disconnected"}`}>
            {status.discordConnected ? "Connected" : "Disconnected"}
          </span>
        </div>

        <div className="status-item">
          <span className="label">Bot User</span>
          <span className="value">{status.botUsername || "N/A"}</span>
        </div>

        <div className="status-item">
          <span className="label">Uptime</span>
          <span className="value">{formatUptime(status.stats.uptimeMs)}</span>
        </div>

        <div className="status-item">
          <span className="label">Messages Sent</span>
          <span className="value">{status.stats.messagesSent}</span>
        </div>

        <div className="status-item">
          <span className="label">Reminders</span>
          <span className="value">{status.stats.remindersTriggered}</span>
        </div>

        <div className="status-item">
          <span className="label">Verifications</span>
          <span className="value">{status.stats.verificationsRun}</span>
        </div>

        <div className="status-item">
          <span className="label">Errors</span>
          <span className={`value ${status.stats.errors > 0 ? "error" : ""}`}>
            {status.stats.errors}
          </span>
        </div>

        <div className="status-item">
          <span className="label">Started</span>
          <span className="value">
            {new Date(status.stats.startTime).toLocaleString()}
          </span>
        </div>
      </div>

      <h3>Scheduled Jobs</h3>
      <table className="jobs-table">
        <thead>
          <tr>
            <th>Job</th>
            <th>Schedule</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {status.scheduledJobs.map((job) => (
            <tr key={job.name}>
              <td>{job.name}</td>
              <td><code>{job.cron}</code></td>
              <td>{cronToTime(job.cron)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={handleRefresh} className="refresh-btn">
        Refresh
      </button>
    </div>
  );
}
