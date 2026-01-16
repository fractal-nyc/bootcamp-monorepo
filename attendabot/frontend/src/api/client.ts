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

/** Removes the JWT token from localStorage. */
export function clearToken(): void {
  localStorage.removeItem("token");
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
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      const data = await res.json();
      return { success: false, error: data.error || "Login failed" };
    }

    const data = await res.json();
    setToken(data.token);
    return { success: true };
  } catch (error) {
    console.log(error);
    return { success: false, error: "Network error" };
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

/** A Discord message with author info and attachments. */
export interface Message {
  id: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar: string | null;
  };
  content: string;
  createdAt: string;
  attachments: Array<{ name: string; url: string }>;
}

/** Response containing messages from a specific channel. */
export interface ChannelMessages {
  channelId: string;
  channelName: string;
  messages: Message[];
}

/** Fetches recent messages from a channel. */
export async function getMessages(
  channelId: string,
  limit: number = 50
): Promise<ChannelMessages | null> {
  try {
    const res = await fetchWithAuth(
      `${API_BASE}/messages/${channelId}?limit=${limit}`
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

/** A message from the user messages endpoint. */
export interface UserMessage {
  id: string;
  channelId: string;
  channelName: string;
  author: {
    id: string;
    username: string;
    displayName: string | null;
  };
  content: string;
  createdAt: string;
}

/** Response containing messages from a specific user. */
export interface UserMessagesResponse {
  userId: string;
  channelId: string | null;
  messages: UserMessage[];
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
