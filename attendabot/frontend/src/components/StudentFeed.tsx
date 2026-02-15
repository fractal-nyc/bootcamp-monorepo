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
  onEditNote?: (noteId: number, content: string, createdAt: string) => Promise<void>;
}

/** Converts a date string to a datetime-local input value (YYYY-MM-DDTHH:MM). */
function toDatetimeLocal(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/** Displays an interleaved feed of EOD messages and instructor notes. */
export function StudentFeed({ items, loading, onDeleteNote, onEditNote }: StudentFeedProps) {
  const [showEods, setShowEods] = useState(true);
  const [showNotes, setShowNotes] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editDate, setEditDate] = useState("");
  const [saving, setSaving] = useState(false);

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

  const startEdit = (item: FeedItem) => {
    setEditingId(item.id);
    setEditContent(item.content);
    setEditDate(toDatetimeLocal(item.createdAt));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
    setEditDate("");
  };

  const saveEdit = async (item: FeedItem) => {
    if (!onEditNote || saving) return;
    setSaving(true);
    const noteId = parseInt(item.id.replace("note_", ""), 10);
    const createdAt = new Date(editDate).toISOString();
    await onEditNote(noteId, editContent, createdAt);
    setEditingId(null);
    setEditContent("");
    setEditDate("");
    setSaving(false);
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
                <span className="feed-item-date">
                  {formatDate(item.createdAt)}
                  {item.updatedAt && (
                    <span className="feed-item-edited"> (edited)</span>
                  )}
                </span>
                {item.type === "note" && onEditNote && editingId !== item.id && (
                  <button
                    className="edit-note-btn"
                    onClick={() => startEdit(item)}
                  >
                    Edit
                  </button>
                )}
                {item.type === "note" && onDeleteNote && editingId !== item.id && (
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
              {editingId === item.id ? (
                <div className="feed-item-edit-form">
                  <textarea
                    className="feed-item-edit-textarea"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    disabled={saving}
                  />
                  <div className="feed-item-edit-controls">
                    <input
                      type="datetime-local"
                      className="note-date-picker"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      disabled={saving}
                    />
                    <button
                      className="feed-item-save-btn"
                      onClick={() => saveEdit(item)}
                      disabled={saving || !editContent.trim()}
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      className="feed-item-cancel-btn"
                      onClick={cancelEdit}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="feed-item-content">{renderWithLinks(item.content)}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
