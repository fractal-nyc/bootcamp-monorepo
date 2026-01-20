/**
 * @fileoverview Student detail view shown in the sidebar.
 * Displays summary, note input, and feed.
 */

import { useState, useEffect, useCallback } from "react";
import type { Student, FeedItem } from "../api/client";
import { getStudentFeed, createNote } from "../api/client";
import { NoteInput } from "./NoteInput";
import { StudentFeed } from "./StudentFeed";

/** Props for the StudentDetail component. */
interface StudentDetailProps {
  student: Student;
  onNoteAdded?: () => void;
}

/** Detail view for a student showing summary, note input, and message feed. */
export function StudentDetail({ student, onNoteAdded }: StudentDetailProps) {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    const items = await getStudentFeed(student.id);
    setFeed(items);
    setLoading(false);
  }, [student.id]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const handleAddNote = async (content: string) => {
    const success = await createNote(student.id, content);
    if (success) {
      await loadFeed();
      onNoteAdded?.();
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusClass = (status: Student["status"]) => {
    switch (status) {
      case "active":
        return "status-active";
      case "inactive":
        return "status-inactive";
      case "graduated":
        return "status-graduated";
      case "withdrawn":
        return "status-withdrawn";
      default:
        return "";
    }
  };

  return (
    <div className="student-detail">
      {/* AI Summary Placeholder */}
      <div className="student-ai-summary">
        <h3>Summary</h3>
        <p className="placeholder-text">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
          tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
          quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
      </div>

      {/* Quick Info Section */}
      <div className="student-summary">
        <div className="summary-row">
          <span className="summary-label">Status</span>
          <span className={`status-badge ${getStatusClass(student.status)}`}>
            {student.status}
          </span>
        </div>
        {student.discordHandle && (
          <div className="summary-row">
            <span className="summary-label">Discord</span>
            <span className="summary-value">@{student.discordHandle}</span>
          </div>
        )}
        {student.currentInternship && (
          <div className="summary-row">
            <span className="summary-label">Internship</span>
            <span className="summary-value">{student.currentInternship}</span>
          </div>
        )}
        <div className="summary-row">
          <span className="summary-label">Last Check-in</span>
          <span className="summary-value">{formatDate(student.lastCheckIn)}</span>
        </div>
      </div>

      {/* Note Input */}
      <div className="student-note-section">
        <h3>Add Note</h3>
        <NoteInput onSubmit={handleAddNote} />
      </div>

      {/* Feed */}
      <div className="student-feed-section">
        <h3>Activity Feed</h3>
        <StudentFeed items={feed} loading={loading} />
      </div>
    </div>
  );
}
