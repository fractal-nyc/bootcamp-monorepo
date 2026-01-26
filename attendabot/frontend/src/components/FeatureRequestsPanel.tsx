/**
 * @fileoverview Panel for viewing and managing feature requests.
 * Supports filtering by status, sorting, and CRUD operations.
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

type StatusFilter = "all" | "new" | "in_progress" | "done";
type SortOption = "priority" | "newest" | "title";

/** Panel for managing feature requests with filter, sort, and CRUD. */
export function FeatureRequestsPanel() {
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("priority");
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
    let filtered = requests;
    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    const sorted = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case "priority":
          return b.priority - a.priority;
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return sorted;
  }, [requests, statusFilter, sortOption]);

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

  const statusFilterOptions: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "new", label: "New" },
    { value: "in_progress", label: "In Progress" },
    { value: "done", label: "Done" },
  ];

  return (
    <div className="panel feature-requests-panel">
      <h2>Feature Requests</h2>

      <div className="fr-controls">
        <div className="fr-filter-pills">
          {statusFilterOptions.map((opt) => (
            <button
              key={opt.value}
              className={`fr-pill ${statusFilter === opt.value ? "active" : ""}`}
              onClick={() => setStatusFilter(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="fr-right-controls">
          <select
            className="fr-sort-select"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
          >
            <option value="priority">Priority (High first)</option>
            <option value="newest">Newest first</option>
            <option value="title">Title (A-Z)</option>
          </select>
          <button onClick={() => setModalOpen(true)}>New Request</button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading feature requests...</div>
      ) : (
        <table className="fr-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Author</th>
              <th>Created</th>
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
