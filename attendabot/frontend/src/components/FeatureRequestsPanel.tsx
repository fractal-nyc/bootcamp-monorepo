/**
 * @fileoverview Panel for viewing and managing feature requests.
 * Supports filtering by status, sorting by column, and CRUD operations.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import type { FeatureRequest } from "../api/client";
import {
  getFeatureRequests,
  createFeatureRequest as apiCreateFeatureRequest,
  updateFeatureRequest as apiUpdateFeatureRequest,
  deleteFeatureRequest as apiDeleteFeatureRequest,
  getUsername,
} from "../api/client";
import { AddFeatureRequestModal } from "./AddFeatureRequestModal";
import { FeatureRequestDetail } from "./FeatureRequestDetail";
import { Sidebar } from "./Sidebar";

type SortField = "title" | "status" | "priority" | "author" | "createdAt";
type SortDirection = "asc" | "desc";

/** Panel for managing feature requests with filter, sort, and CRUD. */
export function FeatureRequestsPanel() {
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(true);
  const [showInProgress, setShowInProgress] = useState(true);
  const [showDone, setShowDone] = useState(false);
  const [sortField, setSortField] = useState<SortField>("priority");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedRequest, setSelectedRequest] = useState<FeatureRequest | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    const data = await getFeatureRequests();
    setRequests(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const filteredAndSorted = useMemo(() => {
    const filtered = requests.filter((r) => {
      if (r.status === "new" && !showNew) return false;
      if (r.status === "in_progress" && !showInProgress) return false;
      if (r.status === "done" && !showDone) return false;
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      let aVal: string | number | null = null;
      let bVal: string | number | null = null;

      switch (sortField) {
        case "title":
          aVal = a.title;
          bVal = b.title;
          break;
        case "status":
          aVal = a.status;
          bVal = b.status;
          break;
        case "priority":
          aVal = a.priority;
          bVal = b.priority;
          break;
        case "author":
          aVal = a.author;
          bVal = b.author;
          break;
        case "createdAt":
          aVal = a.createdAt;
          bVal = b.createdAt;
          break;
      }

      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;

      let comparison: number;
      if (typeof aVal === "number" && typeof bVal === "number") {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [requests, showNew, showInProgress, showDone, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "priority" || field === "createdAt" ? "desc" : "asc");
    }
  };

  const getSortIndicator = (field: SortField) => {
    if (sortField !== field) return "";
    return sortDirection === "asc" ? " ▲" : " ▼";
  };

  const allEnabled = showNew && showInProgress && showDone;

  const handleAllToggle = () => {
    if (allEnabled) {
      setShowNew(false);
      setShowInProgress(false);
      setShowDone(false);
    } else {
      setShowNew(true);
      setShowInProgress(true);
      setShowDone(true);
    }
  };

  const handleRequestClick = (request: FeatureRequest) => {
    setSelectedRequest(request);
    setSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    setSelectedRequest(null);
  };

  const handleAddRequest = async (data: {
    title: string;
    description: string;
    priority: number;
  }) => {
    const author = getUsername() || "Unknown";
    await apiCreateFeatureRequest({
      title: data.title,
      description: data.description,
      priority: data.priority,
      author,
    });
    setModalOpen(false);
    loadRequests();
  };

  const handleUpdate = async (id: number, input: { title?: string; description?: string; status?: FeatureRequest["status"]; priority?: number }) => {
    const updated = await apiUpdateFeatureRequest(id, input);
    if (updated) {
      loadRequests();
      if (selectedRequest?.id === id) {
        setSelectedRequest(updated);
      }
    }
  };

  const handleDelete = async (id: number) => {
    const success = await apiDeleteFeatureRequest(id);
    if (success) {
      loadRequests();
      if (selectedRequest?.id === id) {
        handleCloseSidebar();
      }
    }
  };

  const handleDeleteClick = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleteConfirm === id) {
      handleDelete(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
    }
  };

  const formatDate = (dateString: string) => {
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

  return (
    <div className="panel feature-requests-panel">
      <h2>Feature Requests</h2>

      <div className="fr-controls">
        <div className="fr-filter-pills">
          <button
            className={`fr-pill ${allEnabled ? "active" : ""}`}
            onClick={handleAllToggle}
          >
            All
          </button>
          <button
            className={`fr-pill ${showNew ? "active" : ""}`}
            onClick={() => setShowNew((v) => !v)}
          >
            New
          </button>
          <button
            className={`fr-pill ${showInProgress ? "active" : ""}`}
            onClick={() => setShowInProgress((v) => !v)}
          >
            In Progress
          </button>
          <button
            className={`fr-pill ${showDone ? "active" : ""}`}
            onClick={() => setShowDone((v) => !v)}
          >
            Done
          </button>
        </div>
        <div className="fr-right-controls">
          <button onClick={() => setModalOpen(true)}>New Request</button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading feature requests...</div>
      ) : (
        <table className="fr-table">
          <thead>
            <tr>
              <th onClick={() => handleSort("title")} className="sortable">
                Title{getSortIndicator("title")}
              </th>
              <th onClick={() => handleSort("status")} className="sortable">
                Status{getSortIndicator("status")}
              </th>
              <th onClick={() => handleSort("priority")} className="sortable">
                Priority{getSortIndicator("priority")}
              </th>
              <th onClick={() => handleSort("author")} className="sortable">
                Author{getSortIndicator("author")}
              </th>
              <th onClick={() => handleSort("createdAt")} className="sortable">
                Created{getSortIndicator("createdAt")}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="no-students">
                  No feature requests found
                </td>
              </tr>
            ) : (
              filteredAndSorted.map((req) => (
                <tr key={req.id}>
                  <td>
                    <button
                      className="student-name-link"
                      onClick={() => handleRequestClick(req)}
                    >
                      {req.title}
                    </button>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusClass(req.status)}`}>
                      {req.status === "in_progress" ? "in progress" : req.status}
                    </span>
                  </td>
                  <td>{req.priority}</td>
                  <td>{req.author}</td>
                  <td>{formatDate(req.createdAt)}</td>
                  <td>
                    <button
                      className={`delete-btn ${deleteConfirm === req.id ? "confirm" : ""}`}
                      onClick={(e) => handleDeleteClick(req.id, e)}
                      onBlur={() => setDeleteConfirm(null)}
                    >
                      {deleteConfirm === req.id ? "Confirm?" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      <Sidebar
        isOpen={sidebarOpen}
        onClose={handleCloseSidebar}
        title={selectedRequest?.title || "Feature Request"}
      >
        {selectedRequest && (
          <FeatureRequestDetail
            request={selectedRequest}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        )}
      </Sidebar>

      <AddFeatureRequestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAddRequest}
      />
    </div>
  );
}
