/**
 * @fileoverview Student portal root component with tab navigation.
 * Provides students with read-only access to their own data.
 */

import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { MyEods } from "./MyEods";
import { StudentStats } from "./StudentStats";
import { SimulationsHub } from "./SimulationsHub";

type StudentTab = "stats" | "eods" | "simulations";
const VALID_TABS: StudentTab[] = ["stats", "eods", "simulations"];

interface StudentPortalProps {
  username: string | null;
  sessionInvalid: boolean;
  onLogout: () => void;
  studentDiscordId?: string;
  cohortStartDate?: string;
  cohortEndDate?: string;
}

/** Student portal with tabs for Stats, My EODs, and Simulations. */
export function StudentPortal({ username, sessionInvalid, onLogout, studentDiscordId, cohortStartDate, cohortEndDate }: StudentPortalProps) {
  const embedded = !!studentDiscordId;
  const location = useLocation();
  const navigate = useNavigate();

  // When embedded (instructor impersonation), use local state since URL is /instructor/*
  const [embeddedTab, setEmbeddedTab] = useState<StudentTab>("stats");

  // When standalone, derive tab from URL
  const segment = location.pathname.split("/")[2] ?? "";
  const urlTab: StudentTab = VALID_TABS.includes(segment as StudentTab) ? (segment as StudentTab) : "stats";

  const activeTab = embedded ? embeddedTab : urlTab;
  const setActiveTab = embedded
    ? setEmbeddedTab
    : (tab: StudentTab) => navigate(`/student/${tab}`);

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
          <StudentStats studentDiscordId={studentDiscordId} cohortStartDate={cohortStartDate} cohortEndDate={cohortEndDate} />
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
