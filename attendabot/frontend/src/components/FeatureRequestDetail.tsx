/**
 * @fileoverview Detail view for a feature request shown in the sidebar.
 * Allows editing title, description, status, and priority, and deleting the request.
 */

import { useState, useEffect } from "react";
import type { FeatureRequest } from "../api/client";

/** Props for the FeatureRequestDetail component. */
interface FeatureRequestDetailProps {
  request: FeatureRequest;
  onUpdate: (id: number, input: { title?: string; description?: string; status?: FeatureRequest["status"]; priority?: number }) => void;
  onDelete: (id: number) => void;
}

/** Detail view for a single feature request with inline editing. */
export function FeatureRequestDetail({ request, onUpdate, onDelete }: FeatureRequestDetailProps) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [titleDraft, setTitleDraft] = useState(request.title);
  const [descriptionDraft, setDescriptionDraft] = useState(request.description);

  // Sync drafts when the request prop changes (e.g. after a save)
  useEffect(() => {
    setTitleDraft(request.title);
    setDescriptionDraft(request.description);
  }, [request.title, request.description]);

  const formatDate = (dateString: string) => {
    const utcString = dateString.endsWith("Z") ? dateString : dateString.replace(" ", "T") + "Z";
    const date = new Date(utcString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/New_York",
    });
  };

  const getStatusClass = (status: FeatureRequest["status"]) => {
    switch (status) {
      case "new":
        return "status-new";
      case "in_progress":
        return "status-in-progress";
      case "done":
        return "status-done";
      default:
        return "";
    }
  };

  const handleDeleteClick = () => {
    if (deleteConfirm) {
      onDelete(request.id);
      setDeleteConfirm(false);
    } else {
      setDeleteConfirm(true);
    }
  };

  const handleTitleSave = () => {
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== request.title) {
      onUpdate(request.id, { title: trimmed });
    }
    setEditingTitle(false);
  };

  const handleDescriptionSave = () => {
    const trimmed = descriptionDraft.trim();
    if (trimmed && trimmed !== request.description) {
      onUpdate(request.id, { description: trimmed });
    }
    setEditingDescription(false);
  };

  return (
    <div className="student-detail">
      {/* Title */}
      <h3>Title</h3>
      {editingTitle ? (
        <div className="fr-edit-row">
          <input
            className="fr-edit-input"
            type="text"
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTitleSave();
              if (e.key === "Escape") { setTitleDraft(request.title); setEditingTitle(false); }
            }}
            autoFocus
          />
          <button onClick={handleTitleSave} disabled={!titleDraft.trim()}>Save</button>
          <button className="btn-secondary" onClick={() => { setTitleDraft(request.title); setEditingTitle(false); }}>Cancel</button>
        </div>
      ) : (
        <div className="fr-editable-text" onClick={() => setEditingTitle(true)}>
          {request.title}
          <span className="fr-edit-hint">click to edit</span>
        </div>
      )}

      {/* Description */}
      <h3>Description</h3>
      {editingDescription ? (
        <div className="fr-edit-row fr-edit-row-col">
          <textarea
            className="fr-textarea"
            value={descriptionDraft}
            onChange={(e) => setDescriptionDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") { setDescriptionDraft(request.description); setEditingDescription(false); }
            }}
            rows={5}
            autoFocus
          />
          <div className="fr-edit-actions">
            <button onClick={handleDescriptionSave} disabled={!descriptionDraft.trim()}>Save</button>
            <button className="btn-secondary" onClick={() => { setDescriptionDraft(request.description); setEditingDescription(false); }}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="fr-description-box fr-editable-text" onClick={() => setEditingDescription(true)}>
          {request.description}
          <span className="fr-edit-hint">click to edit</span>
        </div>
      )}

      {/* Quick Info */}
      <h3>Details</h3>
      <div className="student-summary">
        <div className="summary-row">
          <span className="summary-label">Status</span>
          <select
            className="fr-inline-select"
            value={request.status}
            onChange={(e) => onUpdate(request.id, { status: e.target.value as FeatureRequest["status"] })}
          >
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>
        <div className="summary-row">
          <span className="summary-label">Priority</span>
          <input
            className="fr-inline-input"
            type="number"
            value={request.priority}
            onChange={(e) => onUpdate(request.id, { priority: parseInt(e.target.value, 10) || 0 })}
            min={0}
            max={10}
          />
        </div>
        <div className="summary-row">
          <span className="summary-label">Author</span>
          <span className="summary-value">{request.author}</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">Created</span>
          <span className="summary-value">{formatDate(request.createdAt)}</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">Badge</span>
          <span className={`status-badge ${getStatusClass(request.status)}`}>
            {request.status === "in_progress" ? "in progress" : request.status}
          </span>
        </div>
      </div>

      {/* Delete */}
      <div className="fr-delete-section">
        <button
          className={`delete-btn ${deleteConfirm ? "confirm" : ""}`}
          onClick={handleDeleteClick}
          onBlur={() => setDeleteConfirm(false)}
        >
          {deleteConfirm ? "Confirm Delete?" : "Delete Request"}
        </button>
      </div>
    </div>
  );
}
