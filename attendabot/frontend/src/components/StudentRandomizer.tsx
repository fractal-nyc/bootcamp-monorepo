/**
 * @fileoverview Randomizer for shuffling students and dividing them into groups.
 * Receives the current cohort's students as a prop from StudentCohortPanel.
 */

import { useState, useEffect, useMemo } from "react";
import type { Student } from "../api/client";

/** Fisher-Yates shuffle — returns a new shuffled array. */
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Splits an array into `n` groups as evenly as possible (round-robin). */
function splitIntoGroups<T>(array: T[], n: number): T[][] {
  const groups: T[][] = Array.from({ length: n }, () => []);
  array.forEach((item, i) => {
    groups[i % n].push(item);
  });
  return groups;
}

interface StudentRandomizerProps {
  students: Student[];
}

/** Randomizer widget that shuffles students and optionally splits into groups. */
export function StudentRandomizer({ students }: StudentRandomizerProps) {
  const [groupCount, setGroupCount] = useState(1);
  const [groups, setGroups] = useState<Student[][] | null>(null);

  const activeStudents = useMemo(
    () => students.filter((s) => s.status === "active"),
    [students]
  );

  // Clear results when students change
  useEffect(() => {
    setGroups(null);
  }, [activeStudents]);

  // Clamp group count to student count
  useEffect(() => {
    if (groupCount > activeStudents.length && activeStudents.length > 0) {
      setGroupCount(activeStudents.length);
    }
  }, [activeStudents.length, groupCount]);

  const maxGroups = Math.max(1, activeStudents.length);

  const handleShuffle = () => {
    const shuffled = shuffle(activeStudents);
    setGroups(groupCount <= 1 ? [shuffled] : splitIntoGroups(shuffled, groupCount));
  };

  if (activeStudents.length === 0) return null;

  return (
    <div className="randomizer-section">
      <h3>Randomizer</h3>

      <div className="randomizer-controls">
        <div className="randomizer-row">
          <label>Groups</label>
          <div className="group-count-control">
            <button
              className="group-count-btn"
              onClick={() => setGroupCount((c) => Math.max(1, c - 1))}
              disabled={groupCount <= 1}
            >
              -
            </button>
            <span className="group-count-value">{groupCount}</span>
            <button
              className="group-count-btn"
              onClick={() => setGroupCount((c) => Math.min(maxGroups, c + 1))}
              disabled={groupCount >= maxGroups}
            >
              +
            </button>
          </div>
        </div>

        <button
          className="primary-btn shuffle-btn"
          onClick={handleShuffle}
        >
          Shuffle
        </button>
      </div>

      {groups && (
        <div className={`randomizer-results ${groups.length > 1 ? "multi-group" : ""}`}>
          {groups.map((group, gi) => (
            <div key={gi} className="randomizer-group">
              {groups.length > 1 && (
                <div className="randomizer-group-header">
                  Group {gi + 1}
                  <span className="randomizer-group-count">{group.length}</span>
                </div>
              )}
              <ol className="randomizer-list">
                {group.map((student) => (
                  <li key={student.id} className="randomizer-item">
                    {student.name}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
