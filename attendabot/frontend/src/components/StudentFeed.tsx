/**
 * @fileoverview Interleaved feed of EOD messages and instructor notes with filter toggles.
 */

import { useState, useMemo } from "react";
import type { FeedItem } from "../api/client";
import { renderWithLinks } from "../utils/linkify";

/** Props for the StudentFeed component. */
interface StudentFeedProps {
  items: FeedItem[];
  loading?: boolean;
  onDeleteNote?: (noteId: number) => void;
}

/** Displays an interleaved feed of EOD messages and instructor notes. */
export function StudentFeed({ items, loading, onDeleteNote }: StudentFeedProps) {
  const [showEods, setShowEods] = useState(true);
  const [showNotes, setShowNotes] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (item.type === "eod" && !showEods) return false;
      if (item.type === "note" && !showNotes) return false;
      return true;
    });
  }, [items, showEods, showNotes]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return <div className="feed-loading">Loading feed...</div>;
  }

  return (
    <div className="student-feed">
      <div className="feed-filters">
        <label>
          <input
            type="checkbox"
            checked={showEods}
            onChange={(e) => setShowEods(e.target.checked)}
          />
          Show EODs
        </label>
        <label>
          <input
            type="checkbox"
            checked={showNotes}
            onChange={(e) => setShowNotes(e.target.checked)}
          />
          Show Notes
        </label>
      </div>

      {filteredItems.length === 0 ? (
        <div className="no-feed-items">No items to display</div>
      ) : (
        <div className="feed-list">
          {filteredItems.map((item) => (
            <div key={item.id} className={`feed-item feed-item-${item.type}`}>
              <div className="feed-item-header">
                <span className="feed-item-type">
                  {item.type === "eod" ? "EOD" : "Note"}
                </span>
                <span className="feed-item-author">{item.author}</span>
                <span className="feed-item-date">{formatDate(item.createdAt)}</span>
                {item.type === "note" && onDeleteNote && (
                  <button
                    className={`delete-note-btn ${deleteConfirm === item.id ? "confirm" : ""}`}
                    onClick={() => {
                      if (deleteConfirm === item.id) {
                        const noteId = parseInt(item.id.replace("note_", ""), 10);
                        onDeleteNote(noteId);
                        setDeleteConfirm(null);
                      } else {
                        setDeleteConfirm(item.id);
                      }
                    }}
                    onBlur={() => setDeleteConfirm(null)}
                  >
                    {deleteConfirm === item.id ? "Confirm?" : "Delete"}
                  </button>
                )}
              </div>
              <div className="feed-item-content">{renderWithLinks(item.content)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
