/**
 * @fileoverview Student detail view shown in the sidebar.
 * Displays summary, note input, and feed.
 */

import { useState, useEffect, useCallback } from "react";
import Markdown from "react-markdown";
import type { Student, FeedItem, StudentSummaryResponse } from "../api/client";
import { getStudentFeed, createNote, deleteNote, getStudentSummary } from "../api/client";
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

  // AI Summary state
  const [summary, setSummary] = useState<StudentSummaryResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    const items = await getStudentFeed(student.id);
    setFeed(items);
    setLoading(false);
  }, [student.id]);

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    const today = new Date().toISOString().split("T")[0];
    const result = await getStudentSummary(student.id, today);
    if (result) {
      setSummary(result);
    } else {
      setSummaryError("Unable to load summary");
    }
    setSummaryLoading(false);
  }, [student.id]);

  useEffect(() => {
    loadFeed();
    loadSummary();
  }, [loadFeed, loadSummary]);

  const handleAddNote = async (content: string) => {
    const success = await createNote(student.id, content);
    if (success) {
      await loadFeed();
      onNoteAdded?.();
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    const success = await deleteNote(student.id, noteId);
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

  const formatSummaryDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const handleRegenerateSummary = async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    const today = new Date().toISOString().split("T")[0];
    const result = await getStudentSummary(student.id, today, true);
    if (result) {
      setSummary(result);
    } else {
      setSummaryError("Unable to regenerate summary");
    }
    setSummaryLoading(false);
  };

  return (
    <div className="student-detail">
      {/* AI Summary */}
      <div className="student-ai-summary">
        <div className="summary-header">
          <h3>Summary</h3>
          {summary && !summaryLoading && (
            <button
              className="regenerate-btn"
              onClick={handleRegenerateSummary}
              disabled={summaryLoading}
              title="Regenerate summary"
            >
              Regenerate
            </button>
          )}
        </div>
        {summaryLoading ? (
          <p className="summary-loading">Generating summary...</p>
        ) : summaryError ? (
          <p className="summary-error">{summaryError}</p>
        ) : summary ? (
          <>
            <div className="summary-text">
              <Markdown>{summary.summary}</Markdown>
            </div>
            <p className="summary-meta">
              Generated {formatSummaryDate(summary.generatedAt)}
              {summary.cached && " (cached)"}
            </p>
          </>
        ) : (
          <p className="summary-error">No summary available</p>
        )}
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
        <StudentFeed items={feed} loading={loading} onDeleteNote={handleDeleteNote} />
      </div>
    </div>
  );
}
