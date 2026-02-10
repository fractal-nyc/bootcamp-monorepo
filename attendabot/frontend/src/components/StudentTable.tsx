/**
 * @fileoverview Sortable table displaying students in a cohort.
 */

import { useState, useMemo, useEffect } from "react";
import type { Student, Observer } from "../api/client";
import { getStudentImage } from "../api/client";

/** Props for the StudentTable component. */
interface StudentTableProps {
  students: Student[];
  observers: Observer[];
  onStudentClick: (student: Student) => void;
  onDeleteStudent: (student: Student) => void;
  onObserverChange: (student: Student, observerId: number | null) => void;
}

type SortField = "name" | "discordHandle" | "status" | "lastCheckIn" | "currentInternship" | "observerId";
type SortDirection = "asc" | "desc";

/** Sortable table displaying students with clickable names. */
export function StudentTable({ students, observers, onStudentClick, onDeleteStudent, onObserverChange }: StudentTableProps) {
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [studentImages, setStudentImages] = useState<Record<number, string | null>>({});

  // Load profile images for all students
  useEffect(() => {
    const loadImages = async () => {
      const images: Record<number, string | null> = {};
      await Promise.all(
        students.map(async (s) => {
          images[s.id] = await getStudentImage(s.id);
        })
      );
      setStudentImages(images);
    };
    if (students.length > 0) {
      loadImages();
    }
  }, [students]);

  const sortedStudents = useMemo(() => {
    const sorted = [...students].sort((a, b) => {
      let aVal: string | null = null;
      let bVal: string | null = null;

      switch (sortField) {
        case "name":
          aVal = a.name;
          bVal = b.name;
          break;
        case "discordHandle":
          aVal = a.discordHandle;
          bVal = b.discordHandle;
          break;
        case "status":
          aVal = a.status;
          bVal = b.status;
          break;
        case "lastCheckIn":
          aVal = a.lastCheckIn;
          bVal = b.lastCheckIn;
          break;
        case "currentInternship":
          aVal = a.currentInternship;
          bVal = b.currentInternship;
          break;
        case "observerId": {
          const observerMap = new Map(observers.map((o) => [o.id, o.displayName || o.username]));
          aVal = a.observerId ? observerMap.get(a.observerId) || null : null;
          bVal = b.observerId ? observerMap.get(b.observerId) || null : null;
          break;
        }
      }

      // Handle nulls
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;

      // Compare strings
      const comparison = aVal.localeCompare(bVal);
      return sortDirection === "asc" ? comparison : -comparison;
    });
    return sorted;
  }, [students, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIndicator = (field: SortField) => {
    if (sortField !== field) return "";
    return sortDirection === "asc" ? " ▲" : " ▼";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    // SQLite CURRENT_TIMESTAMP is UTC but without 'Z' suffix, so append it
    const utcString = dateString.endsWith("Z") ? dateString : dateString.replace(" ", "T") + "Z";
    const date = new Date(utcString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/New_York",
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

  const handleDeleteClick = (student: Student, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleteConfirm === student.id) {
      onDeleteStudent(student);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(student.id);
    }
  };

  return (
    <table className="student-table">
      <thead>
        <tr>
          <th onClick={() => handleSort("name")} className="sortable">
            Name{getSortIndicator("name")}
          </th>
          <th onClick={() => handleSort("discordHandle")} className="sortable">
            Discord{getSortIndicator("discordHandle")}
          </th>
          <th onClick={() => handleSort("status")} className="sortable">
            Status{getSortIndicator("status")}
          </th>
          <th onClick={() => handleSort("lastCheckIn")} className="sortable">
            Last Check-in{getSortIndicator("lastCheckIn")}
          </th>
          <th onClick={() => handleSort("currentInternship")} className="sortable">
            Internship{getSortIndicator("currentInternship")}
          </th>
          <th onClick={() => handleSort("observerId")} className="sortable">
            Observer{getSortIndicator("observerId")}
          </th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {sortedStudents.length === 0 ? (
          <tr>
            <td colSpan={7} className="no-students">
              No students in this cohort
            </td>
          </tr>
        ) : (
          sortedStudents.map((student) => (
            <tr key={student.id}>
              <td>
                <div className="student-name-cell">
                  {studentImages[student.id] ? (
                    <img
                      src={studentImages[student.id]!}
                      alt={student.name}
                      className="student-avatar"
                    />
                  ) : (
                    <span className="student-avatar-placeholder">
                      {student.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <button
                    className="student-name-link"
                    onClick={() => onStudentClick(student)}
                  >
                    {student.name}
                  </button>
                </div>
              </td>
              <td>{student.discordHandle ? `@${student.discordHandle}` : "—"}</td>
              <td>
                <span className={`status-badge ${getStatusClass(student.status)}`}>
                  {student.status}
                </span>
              </td>
              <td>{formatDate(student.lastCheckIn)}</td>
              <td>{student.currentInternship || "—"}</td>
              <td>
                <select
                  className="observer-select"
                  value={student.observerId ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    onObserverChange(student, val ? Number(val) : null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="">None</option>
                  {observers.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.displayName || o.username}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <button
                  className={`delete-btn ${deleteConfirm === student.id ? "confirm" : ""}`}
                  onClick={(e) => handleDeleteClick(student, e)}
                  onBlur={() => setDeleteConfirm(null)}
                >
                  {deleteConfirm === student.id ? "Confirm?" : "Remove"}
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
