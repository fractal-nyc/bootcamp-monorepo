const API_BASE = "/api";

function getToken(): string | null {
  return localStorage.getItem("token");
}

export function setToken(token: string): void {
  localStorage.setItem("token", token);
}

export function clearToken(): void {
  localStorage.removeItem("token");
}

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
    return { success: false, error: "Network error" };
  }
}

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

export interface Channel {
  id: string;
  name: string;
  guildName: string;
}

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

export interface ChannelMessages {
  channelId: string;
  channelName: string;
  messages: Message[];
}

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
