/**
 * @fileoverview Auth context and provider. Extracts all auth state from App.tsx.
 */

import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { setUsername as storeUsername, clearSession, onAuthFailure, getMe } from "../api/client";
import type { MeResponse } from "../api/client";
import { authClient } from "../lib/auth-client";
import { REQUIRE_LOGIN } from "../lib/featureFlags";

interface AuthState {
  loading: boolean;
  loggedIn: boolean;
  username: string | null;
  role: "instructor" | "student" | null;
  sessionInvalid: boolean;
  me: MeResponse | null;
  studentCohortDates: { startDate?: string; endDate?: string };
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

/** Provides auth state to the component tree. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<"instructor" | "student" | null>(null);
  const [sessionInvalid, setSessionInvalid] = useState(false);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [studentCohortDates, setStudentCohortDates] = useState<{ startDate?: string; endDate?: string }>({});

  useEffect(() => {
    // On localhost (REQUIRE_LOGIN = false), skip auth entirely and act as instructor.
    if (!REQUIRE_LOGIN) {
      setLoggedIn(true);
      setRole("instructor");
      setUsername("Local Dev");
      setLoading(false);
      return;
    }

    // Check for BetterAuth session (Discord OAuth) then fetch role
    authClient.getSession().then(async (result) => {
      if (result.data?.user) {
        const name = result.data.user.name || result.data.user.email || "Discord User";
        storeUsername(name);
        setLoggedIn(true);
        setUsername(name);

        // Fetch role before clearing loading state to prevent redirect flicker
        const meData = await getMe();
        if (meData) {
          setRole(meData.role);
          setMe(meData);
          if (meData.role === "student") {
            setStudentCohortDates({
              startDate: meData.cohortStartDate,
              endDate: meData.cohortEndDate,
            });
          }
        }
      }
      setLoading(false);
    });

    const unsubscribe = onAuthFailure(() => {
      setSessionInvalid(true);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    if (!REQUIRE_LOGIN) return; // no-op in dev mode; refresh restores the bypass session
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
    setMe(null);
  };

  return (
    <AuthContext.Provider value={{ loading, loggedIn, username, role, sessionInvalid, me, studentCohortDates, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Returns the current auth state. Must be used within an AuthProvider. */
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
