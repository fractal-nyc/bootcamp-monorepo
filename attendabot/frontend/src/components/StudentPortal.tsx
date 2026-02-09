/**
 * @fileoverview Student portal root component with tab navigation.
 * Provides students with read-only access to their own data.
 */

import { useState } from "react";
import { MyEods } from "./MyEods";
import { StudentStats } from "./StudentStats";
import { SimulationsHub } from "./SimulationsHub";

type StudentTab = "stats" | "eods" | "simulations";

interface StudentPortalProps {
  username: string | null;
  sessionInvalid: boolean;
  onLogout: () => void;
  studentDiscordId?: string;
}

/** Student portal with tabs for Stats, My EODs, and Simulations. */
export function StudentPortal({ username, sessionInvalid, onLogout, studentDiscordId }: StudentPortalProps) {
  const [activeTab, setActiveTab] = useState<StudentTab>("stats");
  const embedded = !!studentDiscordId;

  const content = (
    <>
      <nav className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === "stats" ? "active" : ""}`}
          onClick={() => setActiveTab("stats")}
        >
          Stats
        </button>
        <button
          className={`tab-btn ${activeTab === "eods" ? "active" : ""}`}
          onClick={() => setActiveTab("eods")}
        >
          My EODs
        </button>
        <button
          className={`tab-btn ${activeTab === "simulations" ? "active" : ""}`}
          onClick={() => setActiveTab("simulations")}
        >
          Simulations
        </button>
      </nav>

      <main>
        {activeTab === "stats" ? (
          <StudentStats studentDiscordId={studentDiscordId} />
        ) : activeTab === "eods" ? (
          <MyEods studentDiscordId={studentDiscordId} />
        ) : (
          <SimulationsHub />
        )}
      </main>
    </>
  );

  if (embedded) return content;

  return (
    <div className="app">
      <header>
        <h1>Attendabot Student Portal</h1>
        <div className="header-right">
          {username && <span className="username">Logged in as {username}</span>}
          <button onClick={onLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      {sessionInvalid && (
        <div className="session-warning">
          Your session has expired or is invalid. Data may not load correctly.
          Please{" "}
          <button onClick={onLogout} className="session-warning-btn">
            log out and log back in
          </button>{" "}
          to fix this.
        </div>
      )}

      {content}
    </div>
  );
}
