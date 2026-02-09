/**
 * @fileoverview Displays the student's own EOD messages.
 */

import { useState, useEffect } from "react";
import { getMyEods } from "../api/client";
import type { StudentEodMessage } from "../api/client";
import { renderWithLinks } from "../utils/linkify";

/** Renders a list of the student's EOD messages. */
export function MyEods() {
  const [messages, setMessages] = useState<StudentEodMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyEods(100).then((msgs) => {
      setMessages(msgs);
      setLoading(false);
    });
  }, []);

  return (
    <div className="panel" style={{ gridColumn: "span 2" }}>
      <h2>My EOD Messages</h2>
      {loading ? (
        <p className="loading">Loading EOD messages...</p>
      ) : messages.length === 0 ? (
        <p className="no-messages">No EOD messages found.</p>
      ) : (
        <div className="messages-list">
          {messages.map((msg) => (
            <div key={msg.id} className="message">
              <div className="message-header">
                <span className="timestamp">
                  {new Date(msg.createdAt).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  {new Date(msg.createdAt).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="message-content">
                {renderWithLinks(msg.content || "")}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
