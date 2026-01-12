import { useState, useEffect } from "react";
import { isLoggedIn, clearToken } from "./api/client";
import { Login } from "./components/Login";
import { StatusPanel } from "./components/StatusPanel";
import { MessageFeed } from "./components/MessageFeed";
import "./App.css";

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
      </main>
    </div>
  );
}

export default App;
