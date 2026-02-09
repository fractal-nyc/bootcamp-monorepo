/**
 * @fileoverview Displays daily stats for the student: attendance, PRs, EOD.
 */

import { useState, useEffect } from "react";
import { getMyStats } from "../api/client";
import type { DailyStats } from "../api/client";

/** Renders a table of daily stats for the student over the last 30 days. */
export function StudentStats() {
  const [days, setDays] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];

    getMyStats(startStr, endStr).then((result) => {
      if (result) {
        setDays(result.days);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="panel" style={{ gridColumn: "span 2" }}>
        <h2>Daily Stats</h2>
        <p className="loading">Loading stats...</p>
      </div>
    );
  }

  return (
    <div className="panel" style={{ gridColumn: "span 2" }}>
      <h2>Daily Stats (Last 30 Days)</h2>
      {days.length === 0 ? (
        <p className="no-messages">No stats available.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="student-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Attendance</th>
                <th>Midday PR</th>
                <th>EOD</th>
                <th>Total PRs</th>
              </tr>
            </thead>
            <tbody>
              {days.map((day) => (
                <tr key={day.date}>
                  <td>
                    {new Date(day.date + "T12:00:00").toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td>
                    {day.attendancePosted ? (
                      <span style={{ color: day.attendanceOnTime ? "#2d6a2e" : "#8B6914" }}>
                        {day.attendanceOnTime ? "On time" : "Late"}
                      </span>
                    ) : (
                      <span style={{ color: "var(--color-error)" }}>Missed</span>
                    )}
                  </td>
                  <td>
                    {day.middayPrPosted ? (
                      <span style={{ color: "#2d6a2e" }}>
                        {day.middayPrCount} PR{day.middayPrCount !== 1 ? "s" : ""}
                      </span>
                    ) : (
                      <span style={{ color: "var(--color-error)" }}>None</span>
                    )}
                  </td>
                  <td>
                    {day.eodPosted ? (
                      <span style={{ color: "#2d6a2e" }}>Posted</span>
                    ) : (
                      <span style={{ color: "var(--color-error)" }}>Missing</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 700 }}>{day.totalPrCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
