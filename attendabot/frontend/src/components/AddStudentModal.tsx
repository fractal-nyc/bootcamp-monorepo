/**
 * @fileoverview Modal for adding a new student to a cohort.
 */

import { useState, useEffect } from "react";
import type { User } from "../api/client";
import { getUsers } from "../api/client";

/** Props for the AddStudentModal component. */
interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    discordUserId?: string;
    status?: "active" | "inactive" | "graduated" | "withdrawn";
    currentInternship?: string;
  }) => void;
}

/** Modal dialog for adding a new student. */
export function AddStudentModal({ isOpen, onClose, onSubmit }: AddStudentModalProps) {
  const [name, setName] = useState("");
  const [discordUserId, setDiscordUserId] = useState("");
  const [status, setStatus] = useState<"active" | "inactive" | "graduated" | "withdrawn">("active");
  const [currentInternship, setCurrentInternship] = useState("");
  const [discordUsers, setDiscordUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getUsers().then(setDiscordUsers);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    onSubmit({
      name: name.trim(),
      discordUserId: discordUserId || undefined,
      status,
      currentInternship: currentInternship.trim() || undefined,
    });

    // Reset form
    setName("");
    setDiscordUserId("");
    setStatus("active");
    setCurrentInternship("");
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
          <h2>Add Student</h2>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="student-name">Name *</label>
            <input
              id="student-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Student name"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="discord-user">Discord Account</label>
            <select
              id="discord-user"
              value={discordUserId}
              onChange={(e) => setDiscordUserId(e.target.value)}
            >
              <option value="">-- None --</option>
              {discordUsers.map((user) => (
                <option key={user.author_id} value={user.author_id}>
                  {user.display_name || user.username} (@{user.username})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="student-status">Status</label>
            <select
              id="student-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="graduated">Graduated</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="internship">Current Internship</label>
            <input
              id="internship"
              type="text"
              value={currentInternship}
              onChange={(e) => setCurrentInternship(e.target.value)}
              placeholder="Company name (optional)"
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading || !name.trim()}>
              {loading ? "Adding..." : "Add Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
