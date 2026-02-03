/**
 * @fileoverview Login form component for admin authentication.
 * Supports multi-user login with username selection and Discord OAuth.
 */

import { useState, useEffect } from "react";
import { login, getUsernames } from "../api/client";
import { authClient } from "../lib/auth-client";

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

  const handleDiscordLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await authClient.signIn.social({
        provider: "discord",
        callbackURL: window.location.origin,
      });
    } catch {
      setError("Discord login failed");
      setLoading(false);
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
      <div className="login-divider">
        <span>or</span>
      </div>
      <div className="login-social">
        <button
          type="button"
          className="discord-login-btn"
          onClick={handleDiscordLogin}
          disabled={loading}
        >
          <svg width="20" height="15" viewBox="0 0 71 55" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M60.1 4.9A58.5 58.5 0 0045.4.2a.2.2 0 00-.2.1 40.8 40.8 0 00-1.8 3.7 54 54 0 00-16.2 0A37.4 37.4 0 0025.4.3a.2.2 0 00-.2-.1A58.4 58.4 0 0010.5 5 .2.2 0 0010.4 5C1.5 18.4-.9 31.4.3 44.3v.1a58.7 58.7 0 0017.9 9.1.2.2 0 00.3-.1 42 42 0 003.6-5.9.2.2 0 00-.1-.3 38.7 38.7 0 01-5.5-2.6.2.2 0 01.5-.4l1.1.9a.2.2 0 00.2 0 41.9 41.9 0 0035.6 0 .2.2 0 00.3 0l1 .8a.2.2 0 01.5.4 36.4 36.4 0 01-5.5 2.7.2.2 0 00-.1.3 47.2 47.2 0 003.6 5.9.2.2 0 00.3.1A58.5 58.5 0 0070.3 44.3v-.1C71.7 29.4 67.8 16.5 60.1 5a.2.2 0 000-.1zM23.7 36.3c-3.4 0-6.2-3.1-6.2-7s2.7-7 6.2-7c3.5 0 6.3 3.2 6.2 7 0 3.9-2.7 7-6.2 7zm22.9 0c-3.4 0-6.2-3.1-6.2-7s2.7-7 6.2-7c3.5 0 6.3 3.2 6.2 7 0 3.9-2.8 7-6.2 7z"/>
          </svg>
          {loading ? "Connecting..." : "Login with Discord"}
        </button>
      </div>
    </div>
  );
}
