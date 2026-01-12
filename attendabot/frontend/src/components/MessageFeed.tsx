import { useEffect, useState } from "react";
import { getChannels, getMessages } from "../api/client";
import type { Channel, Message } from "../api/client";

export function MessageFeed() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [channelName, setChannelName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchChannels = async () => {
      const data = await getChannels();
      if (isMounted) setChannels(data);
    };
    fetchChannels();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedChannel) return;

    let isMounted = true;

    const fetchMessages = async () => {
      setLoading(true);
      setError(null);

      const data = await getMessages(selectedChannel);
      if (!isMounted) return;

      if (data) {
        setMessages(data.messages);
        setChannelName(data.channelName);
      } else {
        setError("Failed to fetch messages");
        setMessages([]);
      }
      setLoading(false);
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedChannel]);

  const handleRefresh = async () => {
    if (!selectedChannel) return;
    setLoading(true);
    setError(null);
    const data = await getMessages(selectedChannel);
    if (data) {
      setMessages(data.messages);
      setChannelName(data.channelName);
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

  return (
    <div className="panel message-feed">
      <h2>Message Feed</h2>

      <div className="channel-selector">
        <select
          value={selectedChannel}
          onChange={(e) => setSelectedChannel(e.target.value)}
        >
          <option value="">Select a channel...</option>
          {channels.map((ch) => (
            <option key={ch.id} value={ch.id}>
              #{ch.name}
            </option>
          ))}
        </select>

        {selectedChannel && (
          <button onClick={handleRefresh} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        )}
      </div>

      {error && <p className="error">{error}</p>}

      {selectedChannel && channelName && (
        <p className="channel-info">Showing messages from #{channelName}</p>
      )}

      <div className="messages-list">
        {messages.length === 0 && selectedChannel && !loading && (
          <p className="no-messages">No messages in the last week</p>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className="message">
            <div className="message-header">
              <span className="author">
                {msg.author.displayName || msg.author.username}
              </span>
              <span className="timestamp">{formatTime(msg.createdAt)}</span>
            </div>
            <div className="message-content">
              {msg.content ? renderWithLinks(msg.content) : <em>(no text content)</em>}
            </div>
            {msg.attachments.length > 0 && (
              <div className="attachments">
                {msg.attachments.map((att, i) => (
                  <a
                    key={i}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {att.name}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
