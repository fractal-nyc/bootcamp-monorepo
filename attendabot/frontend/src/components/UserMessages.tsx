/**
 * @fileoverview User messages component for viewing messages by user,
 * with optional channel filtering.
 */

import { useEffect, useState } from "react";
import { getUsers, getUserMessages, syncDisplayNames } from "../api/client";
import type { User, UserMessage } from "../api/client";

/** Monitored channels available for filtering. */
const MONITORED_CHANNELS = [
  { id: "1336123201968935006", name: "eod" },
  { id: "1418329701658792046", name: "attendance" },
];

/** Displays messages for a selected user with optional channel filtering. */
export function UserMessages() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [messages, setMessages] = useState<UserMessage[]>([]);
  const [userName, setUserName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchUsers = async () => {
      const data = await getUsers();
      if (isMounted) setUsers(data);
    };
    fetchUsers();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedUser) return;

    let isMounted = true;

    const fetchMessages = async () => {
      setLoading(true);
      setError(null);

      const data = await getUserMessages(selectedUser, selectedChannel || undefined);
      if (!isMounted) return;

      if (data) {
        setMessages(data.messages);
        // Find the user's display name
        const user = users.find((u) => u.author_id === selectedUser);
        setUserName(user?.display_name || user?.username || selectedUser);
      } else {
        setError("Failed to fetch messages");
        setMessages([]);
      }
      setLoading(false);
    };

    fetchMessages();

    return () => {
      isMounted = false;
    };
  }, [selectedUser, selectedChannel, users]);

  const handleRefresh = async () => {
    if (!selectedUser) return;
    setLoading(true);
    setError(null);
    const data = await getUserMessages(selectedUser, selectedChannel || undefined);
    if (data) {
      setMessages(data.messages);
    } else {
      setError("Failed to fetch messages");
      setMessages([]);
    }
    setLoading(false);
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  const renderWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s<]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, i) => {
      if (urlRegex.test(part)) {
        return (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer">
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const getUserDisplayName = (user: User) => {
    if (user.display_name) {
      return `${user.display_name} (${user.username})`;
    }
    return user.username;
  };

  const handleSyncDisplayNames = async () => {
    setSyncing(true);
    setError(null);
    const result = await syncDisplayNames();
    if (result.success) {
      // Refresh the users list to show updated display names
      const data = await getUsers();
      setUsers(data);
    } else {
      setError(result.error || "Failed to sync display names");
    }
    setSyncing(false);
  };

  return (
    <div className="panel user-messages">
      <h2>User Messages</h2>

      <div className="channel-selector">
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
        >
          <option value="">Select a user...</option>
          {users.map((user) => (
            <option key={user.author_id} value={user.author_id}>
              {getUserDisplayName(user)}
            </option>
          ))}
        </select>

        <select
          value={selectedChannel}
          onChange={(e) => setSelectedChannel(e.target.value)}
        >
          <option value="">All channels</option>
          {MONITORED_CHANNELS.map((channel) => (
            <option key={channel.id} value={channel.id}>
              #{channel.name}
            </option>
          ))}
        </select>

        {selectedUser && (
          <button onClick={handleRefresh} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        )}

        <button onClick={handleSyncDisplayNames} disabled={syncing}>
          {syncing ? "Syncing..." : "Sync Names"}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {selectedUser && userName && (
        <p className="channel-info">
          Showing {messages.length} messages from {userName}
          {selectedChannel && ` in #${MONITORED_CHANNELS.find(c => c.id === selectedChannel)?.name}`}
        </p>
      )}

      <div className="messages-list">
        {messages.length === 0 && selectedUser && !loading && (
          <p className="no-messages">No messages found for this user</p>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className="message">
            <div className="message-header">
              <span className="author">#{msg.channelName}</span>
              <span className="timestamp">{formatTime(msg.createdAt)}</span>
            </div>
            <div className="message-content">
              {msg.content ? renderWithLinks(msg.content) : <em>(no text content)</em>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
