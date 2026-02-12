/**
 * @fileoverview Instructor admin dashboard route component.
 * Contains tab navigation, impersonation, and all instructor panels.
 */

import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { getCohorts, getStudentsByCohort } from "../api/client";
import type { Student, Cohort } from "../api/client";
import { MessageFeed } from "../components/MessageFeed";
import { UserMessages } from "../components/UserMessages";
import { StudentCohortPanel } from "../components/StudentCohortPanel";
import { TestingPanel } from "../components/TestingPanel";
import { DiagnosticsPanel } from "../components/DiagnosticsPanel";
import { ObserversPanel } from "../components/ObserversPanel";
import { StudentPortal } from "../components/StudentPortal";
import { SimulationsHub } from "../components/SimulationsHub";
import { useAuth } from "../hooks/useAuth";

type Tab = "students" | "simulations" | "observers" | "messages" | "testing" | "diagnostics";
const VALID_TABS: Tab[] = ["students", "simulations", "observers", "messages", "testing", "diagnostics"];

/** Instructor admin dashboard with tabs and impersonation. */
export function InstructorPage() {
  const { username, sessionInvalid, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const segment = location.pathname.split("/")[2] ?? "";
  const activeTab: Tab = VALID_TABS.includes(segment as Tab) ? (segment as Tab) : "students";
  const [impersonating, setImpersonating] = useState<{ discordId: string; name: string; cohortId: number } | null>(null);
  const [impersonateStudents, setImpersonateStudents] = useState<{ discordId: string; name: string; cohortId: number }[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);

  // Load students for impersonation dropdown
  useEffect(() => {
    (async () => {
      const allCohorts = await getCohorts();
      setCohorts(allCohorts);
      const allStudents: Student[] = [];
      for (const cohort of allCohorts) {
        const students = await getStudentsByCohort(cohort.id);
        allStudents.push(...students);
      }
      const withDiscord = allStudents
        .filter((s) => s.discordUserId)
        .map((s) => ({ discordId: s.discordUserId!, name: s.name, cohortId: s.cohortId }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setImpersonateStudents(withDiscord);
    })();
  }, []);

  return (
    <div className="app">
      <header>
        <h1>Attendabot Admin</h1>
        <div className="header-right">
          {username && <span className="username">Logged in as {username}</span>}
          {impersonateStudents.length > 0 && (
            <select
              className="impersonate-select"
              value={impersonating?.discordId ?? ""}
              onChange={(e) => {
                const id = e.target.value;
                if (!id) {
                  setImpersonating(null);
                  return;
                }
                const student = impersonateStudents.find((s) => s.discordId === id);
                if (student) setImpersonating(student);
              }}
            >
              <option value="">View as Student...</option>
              {impersonateStudents.map((s) => (
                <option key={s.discordId} value={s.discordId}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
          <button onClick={logout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      {impersonating && (
        <div className="impersonate-banner">
          Viewing as <strong>{impersonating.name}</strong>
          <button
            className="impersonate-stop-btn"
            onClick={() => setImpersonating(null)}
          >
            Stop
          </button>
        </div>
      )}

      {sessionInvalid && (
        <div className="session-warning">
          Your session has expired or is invalid. Data may not load correctly.
          Please{" "}
          <button onClick={logout} className="session-warning-btn">
            log out and log back in
          </button>{" "}
          to fix this.
        </div>
      )}

      {impersonating ? (
        <StudentPortal
          username={impersonating.name}
          sessionInvalid={sessionInvalid}
          onLogout={logout}
          studentDiscordId={impersonating.discordId}
          cohortStartDate={cohorts.find((c) => c.id === impersonating.cohortId)?.startDate ?? undefined}
          cohortEndDate={cohorts.find((c) => c.id === impersonating.cohortId)?.endDate ?? undefined}
        />
      ) : (
        <>
          <nav className="tab-navigation">
            <button
              className={`tab-btn ${activeTab === "students" ? "active" : ""}`}
              onClick={() => navigate("/instructor/students")}
            >
              Students
            </button>
            <button
              className={`tab-btn ${activeTab === "simulations" ? "active" : ""}`}
              onClick={() => navigate("/instructor/simulations")}
            >
              Simulations
            </button>
            <button
              className={`tab-btn ${activeTab === "observers" ? "active" : ""}`}
              onClick={() => navigate("/instructor/observers")}
            >
              Observers
            </button>
            <button
              className={`tab-btn ${activeTab === "messages" ? "active" : ""}`}
              onClick={() => navigate("/instructor/messages")}
            >
              Messages
            </button>
            <button
              className={`tab-btn ${activeTab === "testing" ? "active" : ""}`}
              onClick={() => navigate("/instructor/testing")}
            >
              Testing
            </button>
            <button
              className={`tab-btn ${activeTab === "diagnostics" ? "active" : ""}`}
              onClick={() => navigate("/instructor/diagnostics")}
            >
              Configuration
            </button>
          </nav>

          <main>
            {activeTab === "students" ? (
              <StudentCohortPanel />
            ) : activeTab === "simulations" ? (
              <SimulationsHub />
            ) : activeTab === "observers" ? (
              <ObserversPanel />
            ) : activeTab === "messages" ? (
              <>
                <MessageFeed />
                <UserMessages />
              </>
            ) : activeTab === "testing" ? (
              <TestingPanel />
            ) : (
              <DiagnosticsPanel />
            )}
          </main>
        </>
      )}
    </div>
  );
}
