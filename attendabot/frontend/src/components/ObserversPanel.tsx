/**
 * @fileoverview Panel for viewing and syncing observers (instructors).
 */

import { useState, useEffect } from "react";
import type { Observer } from "../api/client";
import { getObservers, syncObservers } from "../api/client";

/** Panel displaying observers synced from the Discord @instructors role. */
export function ObserversPanel() {
  const [observers, setObservers] = useState<Observer[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    getObservers().then((o) => {
      setObservers(o);
      setLoading(false);
    });
  }, []);

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
              <th>Name</th>
              <th>Discord Handle</th>
              <th>Discord ID</th>
            </tr>
          </thead>
          <tbody>
            {observers.length === 0 ? (
              <tr>
                <td colSpan={3} className="no-students">
                  No observers synced. Click "Sync from Discord" to fetch instructors.
                </td>
              </tr>
            ) : (
              observers.map((observer) => (
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
