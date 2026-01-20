/**
 * @fileoverview Generic reusable sidebar component that slides from the right.
 */

import { useEffect } from "react";

/** Props for the Sidebar component. */
interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

/** A fixed-position sidebar that slides from the right edge of the screen. */
export function Sidebar({ isOpen, onClose, title, children }: SidebarProps) {
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

  return (
    <>
      {/* Overlay */}
      <div
        className={`sidebar-overlay ${isOpen ? "open" : ""}`}
        onClick={onClose}
      />
      {/* Sidebar panel */}
      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2>{title}</h2>
          <button className="sidebar-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="sidebar-content">{children}</div>
      </div>
    </>
  );
}
