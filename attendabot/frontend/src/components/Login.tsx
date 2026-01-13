/**
 * @fileoverview Login form component for admin authentication.
 */

import { useState } from "react";
import { login } from "../api/client";

/** Props for the Login component. */
interface LoginProps {
  onLogin: () => void;
}

/** Login form that authenticates with the backend. */
export function Login({ onLogin }: LoginProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await login(password);
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
