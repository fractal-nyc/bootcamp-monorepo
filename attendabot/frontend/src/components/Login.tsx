/**
 * @fileoverview Login form component for admin authentication.
 * Supports multi-user login with username selection.
 */

import { useState, useEffect } from "react";
import { login, getUsernames } from "../api/client";

/** Props for the Login component. */
interface LoginProps {
  onLogin: () => void;
}

/** Login form that authenticates with the backend. */
export function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [usernames, setUsernames] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getUsernames().then((names) => {
      setUsernames(names);
      if (names.length > 0) {
        setUsername(names[0]);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await login(password, username || undefined);
    setLoading(false);

    if (result.success) {
      onLogin();
    } else {
      setError(result.error || "Login failed");
    }
  };

  return (
    <div className="login-container">
      <h1>Attendabot Admin</h1>
      <form onSubmit={handleSubmit}>
        {usernames.length > 0 && (
          <select
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          >
            {usernames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        )}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
}
