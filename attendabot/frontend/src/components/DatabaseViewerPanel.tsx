/**
 * @fileoverview Tabular viewer for the SQLite database.
 * Allows browsing tables and downloading the raw DB file.
 */

import { useEffect, useState, useCallback } from "react";
import { getDbTables, getDbTableData, downloadDatabase } from "../api/client";
import type { DbColumn } from "../api/client";

const PAGE_SIZE = 100;

/** Truncates long cell values for display. */
function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  const str = String(value);
  if (str.length > 120) return str.slice(0, 120) + "...";
  return str;
}

/** Panel for browsing SQLite database tables and downloading the DB file. */
export function DatabaseViewerPanel() {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [columns, setColumns] = useState<DbColumn[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDbTables().then((t) => {
      setTables(t);
      if (t.length > 0) setSelectedTable(t[0]);
    });
  }, []);

  const loadTable = useCallback(async (table: string, newOffset: number) => {
    setLoading(true);
    setError(null);
    const data = await getDbTableData(table, PAGE_SIZE, newOffset);
    if (data) {
      setColumns(data.columns);
      setRows(data.rows);
      setTotalRows(data.totalRows);
      setOffset(newOffset);
    } else {
      setError("Failed to load table data");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (selectedTable) {
      loadTable(selectedTable, 0);
    }
  }, [selectedTable, loadTable]);

  const handleTableChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTable(e.target.value);
  };

  const totalPages = Math.ceil(totalRows / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div className="panel db-viewer-panel">
      <h2>Database Viewer</h2>

      <div className="db-controls">
        <div className="db-table-select">
          <label>Table</label>
          <select value={selectedTable || ""} onChange={handleTableChange}>
            {tables.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {selectedTable && (
            <span className="db-row-count">{totalRows} rows</span>
          )}
        </div>
        <button className="db-download-btn" onClick={downloadDatabase}>
          Download DB
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          <div className="db-table-wrapper">
            <table className="db-table">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col.name}>
                      {col.name}
                      {col.pk && <span className="db-pk-badge">PK</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length || 1} className="no-messages">
                      No rows
                    </td>
                  </tr>
                ) : (
                  rows.map((row, i) => (
                    <tr key={i}>
                      {columns.map((col) => (
                        <td key={col.name} title={String(row[col.name] ?? "")}>
                          {formatCell(row[col.name])}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="db-pagination">
              <button
                className="db-page-btn"
                disabled={offset === 0}
                onClick={() => loadTable(selectedTable!, offset - PAGE_SIZE)}
              >
                Prev
              </button>
              <span className="db-page-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="db-page-btn"
                disabled={offset + PAGE_SIZE >= totalRows}
                onClick={() => loadTable(selectedTable!, offset + PAGE_SIZE)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
