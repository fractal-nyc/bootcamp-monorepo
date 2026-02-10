/**
 * @fileoverview Root layout with auth-based redirects.
 */

import { Outlet, Navigate, useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth";

/** Layout that handles auth redirects and renders child routes via Outlet. */
export function RootLayout() {
  const { loading, loggedIn, role, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="app">
        <header>
          <h1>Attendabot</h1>
        </header>
        <main><p>Loading...</p></main>
      </div>
    );
  }

  // Not logged in and not on login page → redirect to login
  if (!loggedIn && location.pathname !== "/") {
    return <Navigate to="/" replace />;
  }

  // Logged in but role couldn't be determined (getMe() failed)
  if (loggedIn && !role && location.pathname !== "/") {
    return (
      <div className="app">
        <header>
          <h1>Attendabot</h1>
          <div className="header-right">
            <button onClick={logout} className="logout-btn">Logout</button>
          </div>
        </header>
        <main><p>Loading...</p></main>
      </div>
    );
  }

  // Logged in and on login page → redirect to role-appropriate dashboard
  if (loggedIn && location.pathname === "/") {
    if (!role) return <Outlet />; // role unknown, stay on login page
    const target = role === "student" ? "/student" : "/instructor";
    return <Navigate to={target} replace />;
  }

  // Logged in but on wrong dashboard for their role
  if (loggedIn && role === "student" && location.pathname.startsWith("/instructor")) {
    return <Navigate to="/student" replace />;
  }
  if (loggedIn && role === "instructor" && location.pathname.startsWith("/student")) {
    return <Navigate to="/instructor" replace />;
  }

  return <Outlet />;
}
