/**
 * @fileoverview Main application component for the attendabot portal.
 * Renders the admin dashboard for instructors or student portal based on role.
 */

import { useState, useEffect } from "react";
import { setUsername as storeUsername, clearSession, onAuthFailure, getMe, getCohorts, getStudentsByCohort } from "./api/client";
import type { Student, Cohort } from "./api/client";
import { authClient } from "./lib/auth-client";
import { Login } from "./components/Login";
import { MessageFeed } from "./components/MessageFeed";
import { UserMessages } from "./components/UserMessages";
import { StudentCohortPanel } from "./components/StudentCohortPanel";
import { TestingPanel } from "./components/TestingPanel";
import { DiagnosticsPanel } from "./components/DiagnosticsPanel";
import { ObserversPanel } from "./components/ObserversPanel";
import { StudentPortal } from "./components/StudentPortal";
import { SimulationsHub } from "./components/SimulationsHub";
import "./App.css";

type Tab = "students" | "simulations" | "observers" | "messages" | "testing" | "diagnostics";

/** Root application component with authentication and role-based dashboard. */
function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("students");
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<"instructor" | "student" | null>(null);
  const [sessionInvalid, setSessionInvalid] = useState(false);
  const [impersonating, setImpersonating] = useState<{ discordId: string; name: string; cohortId: number } | null>(null);
  const [impersonateStudents, setImpersonateStudents] = useState<{ discordId: string; name: string; cohortId: number }[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [studentCohortDates, setStudentCohortDates] = useState<{ startDate?: string; endDate?: string }>({});

  /** Fetches the user's role and identity after login. */
  const fetchRole = async () => {
    const me = await getMe();
    if (me) {
      setRole(me.role);
      if (me.role === "student") {
        setStudentCohortDates({
          startDate: me.cohortStartDate,
          endDate: me.cohortEndDate,
        });
      }
    }
  };

  useEffect(() => {
    // Check for BetterAuth session (Discord OAuth)
    authClient.getSession().then((result) => {
      if (result.data?.user) {
        const name = result.data.user.name || result.data.user.email || "Discord User";
        storeUsername(name);
        setLoggedIn(true);
        setUsername(name);
        fetchRole();
      }
    });

    // Listen for auth failures from any API call
    const unsubscribe = onAuthFailure(() => {
      setSessionInvalid(true);
    });

    return unsubscribe;
  }, []);

  // Load students for impersonation dropdown when instructor
  useEffect(() => {
    if (role !== "instructor") return;
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
  }, [role]);

  const handleLogout = async () => {
    try {
      await authClient.signOut();
    } catch {
      // Ignore errors if no BetterAuth session exists
    }
    clearSession();
    setLoggedIn(false);
    setSessionInvalid(false);
    setUsername(null);
    setRole(null);
    setImpersonating(null);
  };

  if (!loggedIn) {
    return <Login onLogin={() => {
      authClient.getSession().then((result) => {
        if (result.data?.user) {
          const name = result.data.user.name || result.data.user.email || "Discord User";
          storeUsername(name);
          setLoggedIn(true);
          setUsername(name);
          fetchRole();
        }
      });
    }} />;
  }

  // Student portal
  if (role === "student") {
    return (
      <StudentPortal
        username={username}
        sessionInvalid={sessionInvalid}
        onLogout={handleLogout}
        cohortStartDate={studentCohortDates.startDate}
        cohortEndDate={studentCohortDates.endDate}
      />
    );
  }

  // Show loading state while role is being determined
  if (!role) {
    return (
      <div className="app">
        <header>
          <h1>Attendabot</h1>
          <div className="header-right">
            {username && <span className="username">Logged in as {username}</span>}
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </header>
        <main><p>Loading...</p></main>
      </div>
    );
  }

  // Instructor admin dashboard
  return (
    <div className="app">
      <header>
        <h1>Attendabot Admin</h1>
        <div className="header-right">
          {username && <span className="username">Logged in as {username}</span>}
          {role === "instructor" && impersonateStudents.length > 0 && (
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
          <button onClick={handleLogout} className="logout-btn">
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
          <button onClick={handleLogout} className="session-warning-btn">
            log out and log back in
          </button>{" "}
          to fix this.
        </div>
      )}

      {impersonating ? (
        <StudentPortal
          username={impersonating.name}
          sessionInvalid={sessionInvalid}
          onLogout={handleLogout}
          studentDiscordId={impersonating.discordId}
          cohortStartDate={cohorts.find((c) => c.id === impersonating.cohortId)?.startDate ?? undefined}
          cohortEndDate={cohorts.find((c) => c.id === impersonating.cohortId)?.endDate ?? undefined}
        />
      ) : (
        <>
          <nav className="tab-navigation">
            <button
              className={`tab-btn ${activeTab === "students" ? "active" : ""}`}
              onClick={() => setActiveTab("students")}
            >
              Students
            </button>
            <button
              className={`tab-btn ${activeTab === "simulations" ? "active" : ""}`}
              onClick={() => setActiveTab("simulations")}
            >
              Simulations
            </button>
            <button
              className={`tab-btn ${activeTab === "observers" ? "active" : ""}`}
              onClick={() => setActiveTab("observers")}
            >
              Observers
            </button>
            <button
              className={`tab-btn ${activeTab === "messages" ? "active" : ""}`}
              onClick={() => setActiveTab("messages")}
            >
              Messages
            </button>
            <button
              className={`tab-btn ${activeTab === "testing" ? "active" : ""}`}
              onClick={() => setActiveTab("testing")}
            >
              Testing
            </button>
            <button
              className={`tab-btn ${activeTab === "diagnostics" ? "active" : ""}`}
              onClick={() => setActiveTab("diagnostics")}
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

export default App;
