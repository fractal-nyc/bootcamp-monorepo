/**
 * @fileoverview Main application component for the attendabot admin panel.
 * Features tab navigation between Students and Messages views.
 */

import { useState, useEffect } from "react";
import { isLoggedIn, clearToken, getUsername, setUsername as storeUsername, verifySession, onAuthFailure } from "./api/client";
import { authClient } from "./lib/auth-client";
import { Login } from "./components/Login";
import { MessageFeed } from "./components/MessageFeed";
import { UserMessages } from "./components/UserMessages";
import { StudentCohortPanel } from "./components/StudentCohortPanel";
import { TestingPanel } from "./components/TestingPanel";
import { DiagnosticsPanel } from "./components/DiagnosticsPanel";
import "./App.css";

type Tab = "students" | "messages" | "testing" | "diagnostics";

/** Root application component with authentication and admin dashboard. */
function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [activeTab, setActiveTab] = useState<Tab>("students");
  const [username, setUsername] = useState<string | null>(null);
  const [sessionInvalid, setSessionInvalid] = useState(false);

  useEffect(() => {
    // Check JWT-based login first
    if (isLoggedIn()) {
      setLoggedIn(true);
      setUsername(getUsername());

      verifySession().then((valid) => {
        if (!valid) {
          setSessionInvalid(true);
        }
      });
    } else {
      // Check for BetterAuth session (Discord OAuth)
      authClient.getSession().then((result) => {
        if (result.data?.user) {
          const name = result.data.user.name || result.data.user.email || "Discord User";
          storeUsername(name);
          setLoggedIn(true);
          setUsername(name);
        }
      });
    }

    // Listen for auth failures from any API call
    const unsubscribe = onAuthFailure(() => {
      setSessionInvalid(true);
    });

    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    // Sign out from BetterAuth (clears session cookie)
    try {
      await authClient.signOut();
    } catch {
      // Ignore errors if no BetterAuth session exists
    }
    clearToken();
    setLoggedIn(false);
    setSessionInvalid(false);
    setUsername(null);
  };

  if (!loggedIn) {
    return <Login onLogin={() => {
      setLoggedIn(true);
      // Check JWT username first, then BetterAuth session
      const jwtUser = getUsername();
      if (jwtUser) {
        setUsername(jwtUser);
      } else {
        authClient.getSession().then((result) => {
          if (result.data?.user) {
            const name = result.data.user.name || result.data.user.email || "Discord User";
            storeUsername(name);
            setUsername(name);
          }
        });
      }
    }} />;
  }

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
