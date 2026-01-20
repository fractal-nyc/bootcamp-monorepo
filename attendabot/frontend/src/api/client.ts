/**
 * @fileoverview API client for communicating with the attendabot backend.
 * Handles authentication, status, channels, messages, and user data.
 */

const API_BASE = "/api";

function getToken(): string | null {
  return localStorage.getItem("token");
}

/** Stores the JWT token in localStorage. */
export function setToken(token: string): void {
  localStorage.setItem("token", token);
}

/** Stores the username in localStorage. */
export function setUsername(username: string): void {
  localStorage.setItem("username", username);
}

/** Gets the stored username from localStorage. */
export function getUsername(): string | null {
  return localStorage.getItem("username");
}

/** Removes the JWT token and username from localStorage. */
export function clearToken(): void {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
}

/** Returns whether a JWT token exists in localStorage. */
export function isLoggedIn(): boolean {
  return !!getToken();
}

async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  return fetch(url, { ...options, headers });
}

/** Authenticates with the backend and stores the returned JWT token. */
export async function login(
  password: string,
  username?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, username }),
    });

    if (!res.ok) {
      const data = await res.json();
      return { success: false, error: data.error || "Login failed" };
    }

    const data = await res.json();
    setToken(data.token);
    if (data.username) {
      setUsername(data.username);
    }
    return { success: true };
  } catch (error) {
    console.log(error);
    return { success: false, error: "Network error" };
  }
}

/** Fetches the list of valid usernames for login. */
export async function getUsernames(): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/auth/usernames`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.usernames || [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

/** Bot status including connection state, stats, and scheduled jobs. */
export interface BotStatus {
  discordConnected: boolean;
  botUsername: string | null;
  stats: {
    startTime: string;
    uptimeMs: number;
    messagesSent: number;
    messagesReceived: number;
    remindersTriggered: number;
    verificationsRun: number;
    errors: number;
  };
  scheduledJobs: Array<{
    name: string;
    cron: string;
    timezone: string;
  }>;
}

/** Fetches the current bot status from the backend. */
export async function getStatus(): Promise<BotStatus | null> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/status`);
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        clearToken();
      }
      return null;
    }
    return res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

/** A Discord channel the bot can access. */
export interface Channel {
  id: string;
  name: string;
  guildName: string;
}

/** Fetches all channels the bot has access to. */
export async function getChannels(): Promise<Channel[]> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/channels`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.channels;
  } catch (error) {
    console.error(error);
    return [];
  }
}

/** A message with author info, channel info, and optional attachments. */
export interface Message {
  id: string;
  channelId: string;
  channelName: string;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatar?: string | null;
  };
  content: string;
  createdAt: string;
  attachments?: Array<{ name: string; url: string }>;
}

/** Response containing messages from a specific channel. */
export interface ChannelMessages {
  channelId: string;
  channelName: string;
  messages: Message[];
}

/** Fetches recent messages from a channel. Defaults to DB; use source="discord" to fetch live from Discord. */
export async function getMessages(
  channelId: string,
  limit: number = 50,
  source?: "discord" | "db"
): Promise<ChannelMessages | null> {
  try {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (source) {
      params.append("source", source);
    }
    const res = await fetchWithAuth(
      `${API_BASE}/messages/${channelId}?${params.toString()}`
    );
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

/** A user from the database. */
export interface User {
  author_id: string;
  display_name: string | null;
  username: string;
}

/** Fetches all users from the database. */
export async function getUsers(): Promise<User[]> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/users`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.users;
  } catch (error) {
    console.error(error);
    return [];
  }
}

/** Response containing messages from a specific user. */
export interface UserMessagesResponse {
  userId: string;
  channelId: string | null;
  messages: Message[];
}

/** Fetches messages by a specific user, optionally filtered by channel. */
export async function getUserMessages(
  userId: string,
  channelId?: string,
  limit: number = 100
): Promise<UserMessagesResponse | null> {
  try {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (channelId) {
      params.append("channelId", channelId);
    }
    const res = await fetchWithAuth(
      `${API_BASE}/users/${userId}/messages?${params.toString()}`
    );
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

/** Triggers a sync of user display names from Discord. */
export async function syncDisplayNames(): Promise<{
  success: boolean;
  updatedCount?: number;
  error?: string;
}> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/users/sync-display-names`, {
      method: "POST",
    });
    if (!res.ok) {
      const data = await res.json();
      return { success: false, error: data.error || "Sync failed" };
    }
    const data = await res.json();
    return { success: true, updatedCount: data.updatedCount };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Network error" };
  }
}

// ============================================================================
// Cohort and Student API
// ============================================================================

/** A cohort (e.g., Fa2025, Sp2026). */
export interface Cohort {
  id: number;
  name: string;
}

/** A student in a cohort. */
export interface Student {
  id: number;
  name: string;
  discordHandle: string | null;
  discordUserId: string | null;
  cohortId: number;
  status: "active" | "inactive" | "graduated" | "withdrawn";
  lastCheckIn: string | null;
  currentInternship: string | null;
}

/** A feed item (EOD message or instructor note). */
export interface FeedItem {
  type: "eod" | "note";
  id: string;
  content: string;
  author: string;
  createdAt: string;
}

/** Fetches all cohorts. */
export async function getCohorts(): Promise<Cohort[]> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/cohorts`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.cohorts.map((c: { id: number; name: string }) => ({
      id: c.id,
      name: c.name,
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
}

/** Fetches students in a cohort. */
export async function getStudentsByCohort(cohortId: number): Promise<Student[]> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/students?cohortId=${cohortId}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.students.map((s: {
      id: number;
      name: string;
      discord_handle: string | null;
      discord_user_id: string | null;
      cohort_id: number;
      status: string;
      last_check_in: string | null;
      current_internship: string | null;
    }) => ({
      id: s.id,
      name: s.name,
      discordHandle: s.discord_handle,
      discordUserId: s.discord_user_id,
      cohortId: s.cohort_id,
      status: s.status as Student["status"],
      lastCheckIn: s.last_check_in,
      currentInternship: s.current_internship,
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
}

/** Fetches a single student by ID. */
export async function getStudent(id: number): Promise<Student | null> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/students/${id}`);
    if (!res.ok) return null;
    const data = await res.json();
    const s = data.student;
    return {
      id: s.id,
      name: s.name,
      discordHandle: s.discord_handle,
      discordUserId: s.discord_user_id,
      cohortId: s.cohort_id,
      status: s.status,
      lastCheckIn: s.last_check_in,
      currentInternship: s.current_internship,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}

/** Input for creating a student. */
export interface CreateStudentInput {
  name: string;
  cohortId: number;
  discordUserId?: string;
  status?: Student["status"];
  currentInternship?: string;
}

/** Creates a new student. */
export async function createStudent(input: CreateStudentInput): Promise<Student | null> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/students`, {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const s = data.student;
    return {
      id: s.id,
      name: s.name,
      discordHandle: s.discord_handle,
      discordUserId: s.discord_user_id,
      cohortId: s.cohort_id,
      status: s.status,
      lastCheckIn: s.last_check_in,
      currentInternship: s.current_internship,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}

/** Input for updating a student. */
export interface UpdateStudentInput {
  name?: string;
  discordUserId?: string | null;
  cohortId?: number;
  status?: Student["status"];
  currentInternship?: string | null;
}

/** Updates a student. */
export async function updateStudent(id: number, input: UpdateStudentInput): Promise<Student | null> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/students/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const s = data.student;
    return {
      id: s.id,
      name: s.name,
      discordHandle: s.discord_handle,
      discordUserId: s.discord_user_id,
      cohortId: s.cohort_id,
      status: s.status,
      lastCheckIn: s.last_check_in,
      currentInternship: s.current_internship,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}

/** Deletes a student. */
export async function deleteStudent(id: number): Promise<boolean> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/students/${id}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch (error) {
    console.error(error);
    return false;
  }
}

/** Fetches the interleaved feed of EOD messages and instructor notes for a student. */
export async function getStudentFeed(studentId: number, limit: number = 50): Promise<FeedItem[]> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/students/${studentId}/feed?limit=${limit}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.feed.map((item: {
      type: string;
      id: string;
      content: string;
      author: string;
      created_at: string;
    }) => ({
      type: item.type as FeedItem["type"],
      id: item.id,
      content: item.content,
      author: item.author,
      createdAt: item.created_at,
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
}

/** Creates an instructor note for a student. */
export async function createNote(studentId: number, content: string): Promise<boolean> {
  try {
    const username = getUsername() || "Unknown";
    const res = await fetchWithAuth(`${API_BASE}/students/${studentId}/notes`, {
      method: "POST",
      body: JSON.stringify({ content, author: username }),
    });
    return res.ok;
  } catch (error) {
    console.error(error);
    return false;
  }
}
