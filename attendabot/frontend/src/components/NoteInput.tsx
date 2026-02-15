/**
 * @fileoverview Textarea and button for adding instructor notes with optional custom date.
 */

import { useState } from "react";

/** Props for the NoteInput component. */
interface NoteInputProps {
  onSubmit: (content: string, createdAt?: string) => Promise<void>;
  disabled?: boolean;
}

/** Input field for adding instructor notes to a student's record. */
export function NoteInput({ onSubmit, disabled }: NoteInputProps) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customDate, setCustomDate] = useState("");

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    const createdAt = showDatePicker && customDate
      ? new Date(customDate).toISOString()
      : undefined;
    await onSubmit(content.trim(), createdAt);
    setContent("");
    setShowDatePicker(false);
    setCustomDate("");
    setSubmitting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="note-input">
      <textarea
        placeholder="Add a note..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled || submitting}
        rows={3}
      />
      <div className="note-input-controls">
        <label className="note-date-toggle">
          <input
            type="checkbox"
            checked={showDatePicker}
            onChange={(e) => setShowDatePicker(e.target.checked)}
            disabled={disabled || submitting}
          />
          Custom date
        </label>
        {showDatePicker && (
          <input
            type="datetime-local"
            className="note-date-picker"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            disabled={disabled || submitting}
          />
        )}
        <button
          onClick={handleSubmit}
          disabled={disabled || submitting || !content.trim()}
        >
          {submitting ? "Adding..." : "Add Note"}
        </button>
      </div>
    </div>
  );
}
