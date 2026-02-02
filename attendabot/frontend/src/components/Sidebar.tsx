/**
 * @fileoverview Generic reusable sidebar component that slides from the right.
 * Supports horizontal resizing via drag handle.
 */

import { useEffect, useState, useCallback, useRef } from "react";

const MIN_WIDTH = 350;
const MAX_WIDTH = 900;
const DEFAULT_WIDTH = 550;
const STORAGE_KEY = "sidebar-width";

/** Gets the saved sidebar width from localStorage. */
function getSavedWidth(): number {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const parsed = parseInt(saved, 10);
    if (!isNaN(parsed) && parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) {
      return parsed;
    }
  }
  return DEFAULT_WIDTH;
}

/** Props for the Sidebar component. */
interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onTitleChange?: (newTitle: string) => void;
  children: React.ReactNode;
}

/** A fixed-position sidebar that slides from the right edge of the screen. */
export function Sidebar({ isOpen, onClose, title, onTitleChange, children }: SidebarProps) {
  const [width, setWidth] = useState(getSavedWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Sync editedTitle when title prop changes (e.g. selecting a different student)
  useEffect(() => {
    setEditedTitle(title);
    setIsEditingTitle(false);
  }, [title]);

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

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle resize drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      const clampedWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, newWidth));
      setWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      localStorage.setItem(STORAGE_KEY, width.toString());
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, width]);

  // Save width when it changes (debounced via mouseup)
  useEffect(() => {
    if (!isResizing) {
      localStorage.setItem(STORAGE_KEY, width.toString());
    }
  }, [width, isResizing]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`sidebar-overlay ${isOpen ? "open" : ""}`}
        onClick={onClose}
      />
      {/* Sidebar panel */}
      <div
        ref={sidebarRef}
        className={`sidebar ${isOpen ? "open" : ""} ${isResizing ? "resizing" : ""}`}
        style={{ width: `${width}px` }}
      >
        {/* Resize handle */}
        <div
          className="sidebar-resize-handle"
          onMouseDown={handleMouseDown}
        />
        <div className="sidebar-header">
          {onTitleChange && isEditingTitle ? (
            <input
              ref={titleInputRef}
              className="sidebar-title-input"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={() => {
                const trimmed = editedTitle.trim();
                if (trimmed && trimmed !== title) {
                  onTitleChange(trimmed);
                } else {
                  setEditedTitle(title);
                }
                setIsEditingTitle(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  (e.target as HTMLInputElement).blur();
                } else if (e.key === "Escape") {
                  setEditedTitle(title);
                  setIsEditingTitle(false);
                }
              }}
              autoFocus
            />
          ) : (
            <h2
              className={onTitleChange ? "sidebar-title-editable" : ""}
              onClick={() => {
                if (onTitleChange) {
                  setIsEditingTitle(true);
                }
              }}
            >
              {title}
            </h2>
          )}
          <button className="sidebar-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="sidebar-content">{children}</div>
      </div>
    </>
  );
}
