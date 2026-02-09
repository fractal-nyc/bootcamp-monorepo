/**
 * @fileoverview Main application component for the attendabot portal.
 * Renders the admin dashboard for instructors or student portal based on role.
 */

import { useState, useEffect } from "react";
import { setUsername as storeUsername, clearSession, onAuthFailure, getMe } from "./api/client";
import { authClient } from "./lib/auth-client";
import { Login } from "./components/Login";
import { MessageFeed } from "./components/MessageFeed";
import { UserMessages } from "./components/UserMessages";
import { StudentCohortPanel } from "./components/StudentCohortPanel";
import { TestingPanel } from "./components/TestingPanel";
import { DiagnosticsPanel } from "./components/DiagnosticsPanel";
import { ObserversPanel } from "./components/ObserversPanel";
import { StudentPortal } from "./components/StudentPortal";
import "./App.css";

type Tab = "students" | "observers" | "messages" | "testing" | "diagnostics";

/** Root application component with authentication and role-based dashboard. */
function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("students");
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<"instructor" | "student" | null>(null);
  const [sessionInvalid, setSessionInvalid] = useState(false);

  /** Fetches the user's role and identity after login. */
  const fetchRole = async () => {
    const me = await getMe();
    if (me) {
      setRole(me.role);
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
      />
    );
  }

  // Instructor admin dashboard (also shown while role is loading)
  return (
    <div className="app">
      <header>
        <h1>Attendabot Admin</h1>
        <div className="header-right">
          {username && <span className="username">Logged in as {username}</span>}
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

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

      <nav className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === "students" ? "active" : ""}`}
          onClick={() => setActiveTab("students")}
        >
          Students
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
    </div>
  );
}

export default App;
