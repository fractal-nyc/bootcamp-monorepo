/**
 * @fileoverview Tests for getDefaultCohortId() in services/db.ts.
 * Verifies it returns the CURRENT_COHORT_DATABASE_ID constant (currently 2).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

/** Creates a mock better-sqlite3 Database that handles initializeTables. */
function createMockDb(cohortQueryResult?: { id: number }) {
  const mockStmt = {
    run: vi.fn(),
    get: vi.fn(() => cohortQueryResult),
    all: vi.fn(() => []),
  };
  return {
    prepare: vi.fn(() => mockStmt),
    pragma: vi.fn(),
    exec: vi.fn(),
    _mockStmt: mockStmt,
  };
}

describe("getDefaultCohortId", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns the hardcoded CURRENT_COHORT_DATABASE_ID", async () => {
    vi.doMock("better-sqlite3", () => ({
      default: vi.fn(() => createMockDb()),
    }));

    const db = await import("../../services/db");
    expect(db.getDefaultCohortId()).toBe(2);
  });

  it("does not query the database when constant is set", async () => {
    const mockDb = createMockDb({ id: 99 });
    vi.doMock("better-sqlite3", () => ({
      default: vi.fn(() => mockDb),
    }));

    const db = await import("../../services/db");
    // getDefaultCohortId should return the constant, not query the DB for cohorts
    const result = db.getDefaultCohortId();
    expect(result).toBe(2);
    // prepare is called during initializeTables, but the SELECT for cohorts fallback
    // should not be reached since the constant is set
    const prepareCalls = mockDb.prepare.mock.calls.map((c: unknown[]) => c[0]);
    expect(prepareCalls).not.toContainEqual(
      expect.stringContaining("SELECT id FROM cohorts")
    );
  });
});
