/**
 * @fileoverview Textarea and button for adding instructor notes.
 */

import { useState } from "react";

/** Props for the NoteInput component. */
interface NoteInputProps {
  onSubmit: (content: string) => Promise<void>;
  disabled?: boolean;
}

/** Input field for adding instructor notes to a student's record. */
export function NoteInput({ onSubmit, disabled }: NoteInputProps) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    await onSubmit(content.trim());
    setContent("");
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
      <button
        onClick={handleSubmit}
        disabled={disabled || submitting || !content.trim()}
      >
        {submitting ? "Adding..." : "Add Note"}
      </button>
    </div>
  );
}
