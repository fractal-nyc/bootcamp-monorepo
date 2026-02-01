/**
 * @fileoverview Modal for adding a new feature request.
 */

import { useState, useEffect } from "react";

/** Props for the AddFeatureRequestModal component. */
interface AddFeatureRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    priority: number;
  }) => void;
}

/** Modal dialog for adding a new feature request. */
export function AddFeatureRequestModal({ isOpen, onClose, onSubmit }: AddFeatureRequestModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setLoading(true);
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      priority,
    });

    // Reset form
    setTitle("");
    setDescription("");
    setPriority(0);
    setLoading(false);
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Feature Request</h2>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="fr-title">Title *</label>
            <input
              id="fr-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief feature title"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="fr-description">Description *</label>
            <textarea
              id="fr-description"
              className="fr-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the feature in detail..."
              required
              rows={4}
            />
          </div>

          <div className="form-group">
            <label htmlFor="fr-priority">Priority</label>
            <input
              id="fr-priority"
              type="number"
              value={priority}
              onChange={(e) => setPriority(parseInt(e.target.value, 10) || 0)}
              min={0}
              max={10}
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading || !title.trim() || !description.trim()}>
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
