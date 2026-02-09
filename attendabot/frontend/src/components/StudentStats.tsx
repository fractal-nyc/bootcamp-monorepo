/**
 * @fileoverview Displays daily stats for the student: attendance, PRs, EOD.
 * Sundays are replaced with a weekly summary row aggregating Mon-Sat.
 */

import { useState, useEffect, useMemo } from "react";
import { getMyStats } from "../api/client";
import type { DailyStats } from "../api/client";

interface StudentStatsProps {
  studentDiscordId?: string;
  cohortStartDate?: string;
  cohortEndDate?: string;
}

/** A row in the stats table — either a single day or a weekly summary. */
type StatsRow =
  | { type: "day"; day: DailyStats }
  | { type: "week"; sundayDate: string; weekDays: DailyStats[] };

/** Renders a table of daily stats for the student over the cohort date range (or last 30 days as fallback). */
export function StudentStats({ studentDiscordId, cohortStartDate, cohortEndDate }: StudentStatsProps) {
  const [days, setDays] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    const fallbackStart = new Date();
    fallbackStart.setDate(fallbackStart.getDate() - 30);

    const startStr = cohortStartDate ?? fallbackStart.toISOString().split("T")[0];
    const endStr = cohortEndDate && cohortEndDate < today ? cohortEndDate : today;

    getMyStats(startStr, endStr, studentDiscordId).then((result) => {
      if (result) {
        setDays(result.days);
      }
      setLoading(false);
    });
  }, [studentDiscordId, cohortStartDate, cohortEndDate]);

  /** Build rows: normal days for Mon-Sat, weekly summary rows replacing Sundays. */
  const rows: StatsRow[] = useMemo(() => {
    // days is sorted DESC by date
    const result: StatsRow[] = [];
    // Group days by their week (Sunday = week boundary)
    // For each Sunday, collect the preceding Mon-Sat
    const daysByDate = new Map(days.map((d) => [d.date, d]));

    for (const day of days) {
      const date = new Date(day.date + "T12:00:00");
      const dow = date.getDay(); // 0 = Sunday
      if (dow === 0) {
        // Collect Mon-Sat of this week (Mon = Sunday-6, Sat = Sunday-1)
        const weekDays: DailyStats[] = [];
        for (let offset = 6; offset >= 1; offset--) {
          const d = new Date(date);
          d.setDate(d.getDate() - offset);
          const key = d.toISOString().split("T")[0];
          const found = daysByDate.get(key);
          if (found) weekDays.push(found);
        }
        result.push({ type: "week", sundayDate: day.date, weekDays });
      } else {
        result.push({ type: "day", day });
      }
    }
    return result;
  }, [days]);

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
      <h2>Daily Stats{cohortStartDate ? "" : " (Last 30 Days)"}</h2>
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
              {rows.map((row) =>
                row.type === "day" ? (
                  <DayRow key={row.day.date} day={row.day} />
                ) : (
                  <WeekRow key={row.sundayDate} sundayDate={row.sundayDate} weekDays={row.weekDays} />
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** Renders a single day row. */
function DayRow({ day }: { day: DailyStats }) {
  return (
    <tr>
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
  );
}

/** Renders a weekly summary row replacing a Sunday. */
function WeekRow({ sundayDate, weekDays }: { sundayDate: string; weekDays: DailyStats[] }) {
  const onTime = weekDays.filter((d) => d.attendancePosted && d.attendanceOnTime).length;
  const late = weekDays.filter((d) => d.attendancePosted && !d.attendanceOnTime).length;
  const missed = weekDays.filter((d) => !d.attendancePosted).length;
  const middayDays = weekDays.filter((d) => d.middayPrPosted).length;
  const eodDays = weekDays.filter((d) => d.eodPosted).length;
  const totalPrs = weekDays.reduce((sum, d) => sum + d.totalPrCount, 0);

  // Find Mon date for the label (Sunday - 6)
  const sun = new Date(sundayDate + "T12:00:00");
  const mon = new Date(sun);
  mon.setDate(mon.getDate() - 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <tr style={{ background: "var(--color-platinum)" }}>
      <td style={{ fontWeight: 700 }}>
        Week: {fmt(mon)} – {fmt(sun)}
      </td>
      <td>
        <span style={{ color: "#2d6a2e" }}>{onTime}</span>
        {" / "}
        <span style={{ color: "#8B6914" }}>{late}</span>
        {" / "}
        <span style={{ color: "var(--color-error)" }}>{missed}</span>
      </td>
      <td>{middayDays}/6</td>
      <td>{eodDays}/6</td>
      <td style={{ fontWeight: 700 }}>{totalPrs}</td>
    </tr>
  );
}
