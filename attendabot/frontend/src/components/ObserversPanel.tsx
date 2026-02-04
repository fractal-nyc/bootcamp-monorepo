/**
 * @fileoverview Panel for viewing and syncing observers (instructors).
 */

import { useState, useEffect, useMemo } from "react";
import type { Observer } from "../api/client";
import { getObservers, syncObservers } from "../api/client";

type SortField = "displayName" | "username" | "discordUserId";
type SortDirection = "asc" | "desc";

/** Panel displaying observers synced from the Discord @instructors role. */
export function ObserversPanel() {
  const [observers, setObservers] = useState<Observer[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [sortField, setSortField] = useState<SortField>("displayName");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  useEffect(() => {
    getObservers().then((o) => {
      setObservers(o);
      setLoading(false);
    });
  }, []);

  const sortedObservers = useMemo(() => {
    const sorted = [...observers].sort((a, b) => {
      let aVal: string;
      let bVal: string;

      switch (sortField) {
        case "displayName":
          aVal = a.displayName || a.username;
          bVal = b.displayName || b.username;
          break;
        case "username":
          aVal = a.username;
          bVal = b.username;
          break;
        case "discordUserId":
          aVal = a.discordUserId;
          bVal = b.discordUserId;
          break;
      }

      const comparison = aVal.localeCompare(bVal);
      return sortDirection === "asc" ? comparison : -comparison;
    });
    return sorted;
  }, [observers, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIndicator = (field: SortField) => {
    if (sortField !== field) return "";
    return sortDirection === "asc" ? " ▲" : " ▼";
  };

  const handleSync = async () => {
    setSyncing(true);
    const synced = await syncObservers();
    setObservers(synced);
    setSyncing(false);
  };

  return (
    <div className="panel observers-panel">
      <h2>Observers ({observers.length})</h2>

      <div className="cohort-controls">
        <button onClick={handleSync} disabled={syncing}>
          {syncing ? "Syncing..." : "Sync from Discord"}
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading observers...</div>
      ) : (
        <table className="student-table">
          <thead>
            <tr>
              <th onClick={() => handleSort("displayName")} className="sortable">
                Name{getSortIndicator("displayName")}
              </th>
              <th onClick={() => handleSort("username")} className="sortable">
                Discord Handle{getSortIndicator("username")}
              </th>
              <th onClick={() => handleSort("discordUserId")} className="sortable">
                Discord ID{getSortIndicator("discordUserId")}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedObservers.length === 0 ? (
              <tr>
                <td colSpan={3} className="no-students">
                  No observers synced. Click "Sync from Discord" to fetch instructors.
                </td>
              </tr>
            ) : (
              sortedObservers.map((observer) => (
                <tr key={observer.id}>
                  <td>{observer.displayName || observer.username}</td>
                  <td>@{observer.username}</td>
                  <td>{observer.discordUserId}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
