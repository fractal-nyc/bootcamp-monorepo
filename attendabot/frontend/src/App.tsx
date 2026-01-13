/**
 * @fileoverview Main application component for the attendabot admin panel.
 */

import { useState, useEffect } from "react";
import { isLoggedIn, clearToken } from "./api/client";
import { Login } from "./components/Login";
import { StatusPanel } from "./components/StatusPanel";
import { MessageFeed } from "./components/MessageFeed";
import { UserMessages } from "./components/UserMessages";
import "./App.css";

/** Root application component with authentication and admin dashboard. */
function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());

  useEffect(() => {
    setLoggedIn(isLoggedIn());
  }, []);

  const handleLogout = () => {
    clearToken();
    setLoggedIn(false);
  };

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <div className="app">
      <header>
        <h1>Attendabot Admin</h1>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </header>

      <main>
        <StatusPanel />
        <MessageFeed />
        <UserMessages />
      </main>
    </div>
  );
}

export default App;
