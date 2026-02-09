/**
 * @fileoverview API client for communicating with the attendabot backend.
 * Authentication is handled by BetterAuth session cookies.
 */

const API_BASE = "/api";

/** Stores the username in localStorage for display purposes. */
export function setUsername(username: string): void {
  localStorage.setItem("username", username);
}

/** Gets the stored username from localStorage. */
export function getUsername(): string | null {
  return localStorage.getItem("username");
}

/** Clears the stored username from localStorage. */
export function clearSession(): void {
  localStorage.removeItem("username");
}

/** Callback invoked when an API call receives a 401/403 response. */
let authFailureCallback: (() => void) | null = null;

/** Registers a callback to be called when authentication fails during an API request. */
export function onAuthFailure(callback: () => void): () => void {
  authFailureCallback = callback;
  return () => {
    if (authFailureCallback === callback) {
      authFailureCallback = null;
    }
  };
}

async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const res = await fetch(url, { ...options, headers, credentials: "include" });

  if (res.status === 401 || res.status === 403) {
    if (authFailureCallback) {
      authFailureCallback();
    }
  }

  return res;
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
    if (!res.ok) return null;
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

/** Fetches recent messages from a channel. Defaults to Discord; use source="db" to fetch from database. */
export async function getMessages(
  channelId: string,
  limit: number = 50,
  source: "discord" | "db" = "discord"
): Promise<ChannelMessages | null> {
  try {
    const params = new URLSearchParams({ limit: limit.toString() });
    params.append("source", source);
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
  observerId: number | null;
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
      observer_id: number | null;
    }) => ({
      id: s.id,
      name: s.name,
      discordHandle: s.discord_handle,
      discordUserId: s.discord_user_id,
      cohortId: s.cohort_id,
      status: s.status as Student["status"],
      lastCheckIn: s.last_check_in,
      currentInternship: s.current_internship,
      observerId: s.observer_id,
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
      observerId: s.observer_id,
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
      observerId: s.observer_id,
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
  observerId?: number | null;
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
      observerId: s.observer_id,
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

/** Fetches a student's profile image as a base64 data URL. */
export async function getStudentImage(studentId: number): Promise<string | null> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/students/${studentId}/image`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.image ?? null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

/** Uploads a profile image for a student. Reads the file and sends as base64 data URL. */
export async function uploadStudentImage(studentId: number, file: File): Promise<boolean> {
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const res = await fetchWithAuth(`${API_BASE}/students/${studentId}/image`, {
      method: "PUT",
      body: JSON.stringify({ image: dataUrl }),
    });
    return res.ok;
  } catch (error) {
    console.error(error);
    return false;
  }
}

/** Removes a student's profile image. */
export async function deleteStudentImage(studentId: number): Promise<boolean> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/students/${studentId}/image`, {
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

/** Deletes an instructor note. Returns true if deleted. */
export async function deleteNote(studentId: number, noteId: number): Promise<boolean> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/students/${studentId}/notes/${noteId}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch (error) {
    console.error(error);
    return false;
  }
}

// ============================================================================
// LLM API
// ============================================================================

/** Response from the student summary endpoint. */
export interface StudentSummaryResponse {
  summary: string;
  cached: boolean;
  generatedAt: string;
}

/**
 * Fetches an AI-generated summary for a student.
 * @param studentId - The student ID.
 * @param date - The date in YYYY-MM-DD format (cumulative - analyzes all data up to this date).
 * @param force - If true, bypasses cache and regenerates the summary.
 * @returns The summary response or null on error.
 */
export async function getStudentSummary(
  studentId: number,
  date: string,
  force: boolean = false
): Promise<StudentSummaryResponse | null> {
  try {
    const params = force ? "?force=true" : "";
    const res = await fetchWithAuth(`${API_BASE}/llm/student/${studentId}/summary/${date}${params}`);
    if (!res.ok) {
      if (res.status === 503) {
        // LLM not configured
        return null;
      }
      return null;
    }
    return res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

// ============================================================================
// Testing API
// ============================================================================

/**
 * Sends a test briefing for a given cohort and simulated date.
 * The briefing is sent to the #bot-test channel.
 * @param cohortId - The cohort to generate the briefing for.
 * @param simulatedDate - The simulated "today" date (YYYY-MM-DD). Briefing shows previous day's data.
 */
export async function sendTestBriefing(
  cohortId: number,
  simulatedDate: string
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/testing/briefing`, {
      method: "POST",
      body: JSON.stringify({ cohortId, simulatedDate }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, message: data.error || "Failed to send briefing" };
    }
    return { success: true, message: data.message || "Briefing sent successfully" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Network error" };
  }
}

/**
 * Sends a test EOD assignment preview for a simulated date.
 * The preview is sent to the #bot-test channel.
 * @param simulatedDate - The simulated EOD cron run date (YYYY-MM-DD). Preview shows tomorrow's assignment.
 */
export async function sendTestEodPreview(
  simulatedDate: string
): Promise<{ success: boolean; message: string; preview?: string }> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/testing/eod-preview`, {
      method: "POST",
      body: JSON.stringify({ simulatedDate }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, message: data.error || "Failed to get preview" };
    }
    return {
      success: data.success,
      message: data.message || "Preview generated",
      preview: data.preview,
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Network error" };
  }
}

/**
 * Sends a test message to the LLM endpoint and returns the response or error details.
 * @param message - The prompt to send to the LLM.
 */
export async function sendTestLlmMessage(
  message: string
): Promise<{
  success: boolean;
  text?: string;
  usage?: { promptTokens: number; completionTokens: number } | null;
  elapsedMs?: number;
  error?: string;
  detail?: { name?: string; message?: string; stack?: string };
}> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/testing/llm-test`, {
      method: "POST",
      body: JSON.stringify({ message }),
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data.error || "LLM request failed",
        detail: data.detail,
      };
    }
    return {
      success: true,
      text: data.text,
      usage: data.usage,
      elapsedMs: data.elapsedMs,
    };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Network error — could not reach the server" };
  }
}

// ============================================================================
// Feature Requests API
// ============================================================================

/** A feature request. */
export interface FeatureRequest {
  id: number;
  title: string;
  description: string;
  priority: number;
  author: string;
  status: "new" | "in_progress" | "done";
  createdAt: string;
}

/** Fetches all feature requests. */
export async function getFeatureRequests(): Promise<FeatureRequest[]> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/feature-requests`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.featureRequests.map((fr: {
      id: number;
      title: string;
      description: string;
      priority: number;
      author: string;
      status: string;
      created_at: string;
    }) => ({
      id: fr.id,
      title: fr.title,
      description: fr.description,
      priority: fr.priority,
      author: fr.author,
      status: fr.status as FeatureRequest["status"],
      createdAt: fr.created_at,
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
}

/** Input for creating a feature request. */
export interface CreateFeatureRequestInput {
  title: string;
  description: string;
  priority?: number;
  author: string;
}

/** Creates a new feature request. */
export async function createFeatureRequest(input: CreateFeatureRequestInput): Promise<FeatureRequest | null> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/feature-requests`, {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const fr = data.featureRequest;
    return {
      id: fr.id,
      title: fr.title,
      description: fr.description,
      priority: fr.priority,
      author: fr.author,
      status: fr.status,
      createdAt: fr.created_at,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}

/** Input for updating a feature request. */
export interface UpdateFeatureRequestInput {
  title?: string;
  description?: string;
  priority?: number;
  status?: FeatureRequest["status"];
}

/** Updates a feature request. */
export async function updateFeatureRequest(id: number, input: UpdateFeatureRequestInput): Promise<FeatureRequest | null> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/feature-requests/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const fr = data.featureRequest;
    return {
      id: fr.id,
      title: fr.title,
      description: fr.description,
      priority: fr.priority,
      author: fr.author,
      status: fr.status,
      createdAt: fr.created_at,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}

/** Deletes a feature request. */
export async function deleteFeatureRequest(id: number): Promise<boolean> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/feature-requests/${id}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch (error) {
    console.error(error);
    return false;
  }
}

// ============================================================================
// Feature Flags API
// ============================================================================

/** A feature flag. */
export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string;
  updatedAt: string;
}

/** Fetches all feature flags. */
export async function getFeatureFlags(): Promise<FeatureFlag[]> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/feature-flags`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.featureFlags.map((f: {
      key: string;
      enabled: boolean;
      description: string;
      updated_at: string;
    }) => ({
      key: f.key,
      enabled: f.enabled,
      description: f.description,
      updatedAt: f.updated_at,
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
}

// ============================================================================
// Observers API
// ============================================================================

/** An observer (instructor). */
export interface Observer {
  id: number;
  discordUserId: string;
  displayName: string | null;
  username: string;
}

/** Fetches all observers. */
export async function getObservers(): Promise<Observer[]> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/observers`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.observers.map((o: {
      id: number;
      discord_user_id: string;
      display_name: string | null;
      username: string;
    }) => ({
      id: o.id,
      discordUserId: o.discord_user_id,
      displayName: o.display_name,
      username: o.username,
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
}

/** Syncs observers from the Discord @instructors role. */
export async function syncObservers(): Promise<Observer[]> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/observers/sync`, {
      method: "POST",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.observers.map((o: {
      id: number;
      discord_user_id: string;
      display_name: string | null;
      username: string;
    }) => ({
      id: o.id,
      discordUserId: o.discord_user_id,
      displayName: o.display_name,
      username: o.username,
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
}

// ============================================================================
// Database Viewer API
// ============================================================================

/** Column metadata for a database table. */
export interface DbColumn {
  name: string;
  type: string;
  pk: boolean;
}

/** Response from the table data endpoint. */
export interface DbTableData {
  table: string;
  columns: DbColumn[];
  rows: Record<string, unknown>[];
  totalRows: number;
  limit: number;
  offset: number;
}

/** Fetches the list of all database tables. */
export async function getDbTables(): Promise<string[]> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/database/tables`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.tables;
  } catch (error) {
    console.error(error);
    return [];
  }
}

/** Fetches rows and column info for a specific table. */
export async function getDbTableData(
  tableName: string,
  limit: number = 100,
  offset: number = 0
): Promise<DbTableData | null> {
  try {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    const res = await fetchWithAuth(`${API_BASE}/database/tables/${encodeURIComponent(tableName)}?${params}`);
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

/** Triggers a download of the raw SQLite database file. */
export function downloadDatabase(): void {
  window.open(`${API_BASE}/database/download`, "_blank");
}

/** Updates a feature flag's enabled state. */
export async function updateFeatureFlag(
  key: string,
  enabled: boolean
): Promise<FeatureFlag | null> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/feature-flags/${encodeURIComponent(key)}`, {
      method: "PUT",
      body: JSON.stringify({ enabled }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const f = data.featureFlag;
    return {
      key: f.key,
      enabled: f.enabled,
      description: f.description,
      updatedAt: f.updated_at,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}

// ============================================================================
// Identity / Role API
// ============================================================================

/** Response from GET /api/auth/me. */
export interface MeResponse {
  role: "instructor" | "student";
  name: string;
  discordAccountId?: string;
  studentId?: number;
  studentName?: string;
}

/** Fetches the current user's role and identity. */
export async function getMe(): Promise<MeResponse | null> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/auth/me`);
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

// ============================================================================
// Student Portal API
// ============================================================================

/** An EOD message for the student portal. */
export interface StudentEodMessage {
  id: string;
  content: string;
  createdAt: string;
  channelName: string;
}

/** Fetches the student's own EOD messages. */
export async function getMyEods(limit: number = 100): Promise<StudentEodMessage[]> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/student-portal/eods?limit=${limit}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.messages;
  } catch (error) {
    console.error(error);
    return [];
  }
}

/** Daily stats for a student. */
export interface DailyStats {
  date: string;
  attendancePosted: boolean;
  attendanceOnTime: boolean;
  middayPrPosted: boolean;
  middayPrCount: number;
  eodPosted: boolean;
  totalPrCount: number;
}

/** Fetches daily stats for the student over the given date range. */
export async function getMyStats(
  startDate: string,
  endDate: string
): Promise<{ days: DailyStats[] } | null> {
  try {
    const params = new URLSearchParams({ startDate, endDate });
    const res = await fetchWithAuth(`${API_BASE}/student-portal/stats?${params}`);
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}
