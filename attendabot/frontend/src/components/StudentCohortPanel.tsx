/**
 * @fileoverview Main panel for viewing students by cohort.
 * Contains cohort selector, student table, and opens sidebar for student details.
 */

import { useState, useEffect, useCallback } from "react";
import type { Cohort, Student, Observer } from "../api/client";
import {
  getCohorts,
  getStudentsByCohort,
  createStudent,
  deleteStudent,
  updateStudent,
  getObservers,
} from "../api/client";
import { StudentTable } from "./StudentTable";
import { StudentDetail } from "./StudentDetail";
import { AddStudentModal } from "./AddStudentModal";
import { Sidebar } from "./Sidebar";

/** Main panel for managing students organized by cohort. */
export function StudentCohortPanel() {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [selectedCohortId, setSelectedCohortId] = useState<number | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [observers, setObservers] = useState<Observer[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load cohorts and observers on mount
  useEffect(() => {
    getCohorts().then((c) => {
      const sorted = [...c].sort((a, b) => b.id - a.id);
      setCohorts(sorted);
      if (sorted.length > 0) {
        setSelectedCohortId(sorted[0].id);
      }
      setLoading(false);
    });
    getObservers().then(setObservers);
  }, []);

  // Load students when cohort changes
  const loadStudents = useCallback(async () => {
    if (selectedCohortId === null) return;
    setLoading(true);
    const s = await getStudentsByCohort(selectedCohortId);
    setStudents(s);
    setLoading(false);
  }, [selectedCohortId]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
    setSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    setSelectedStudent(null);
  };

  const handleAddStudent = async (data: {
    name: string;
    discordUserId?: string;
    status?: Student["status"];
    currentInternship?: string;
  }) => {
    if (selectedCohortId === null) return;

    await createStudent({
      name: data.name,
      cohortId: selectedCohortId,
      discordUserId: data.discordUserId,
      status: data.status,
      currentInternship: data.currentInternship,
    });

    setModalOpen(false);
    loadStudents();
  };

  const handleDeleteStudent = async (student: Student) => {
    const success = await deleteStudent(student.id);
    if (success) {
      loadStudents();
      if (selectedStudent?.id === student.id) {
        handleCloseSidebar();
      }
    }
  };

  const handleNoteAdded = () => {
    // Refresh students to update lastCheckIn
    loadStudents();
  };

  const handleObserverChange = async (student: Student, observerId: number | null) => {
    const updated = await updateStudent(student.id, { observerId });
    if (updated) {
      loadStudents();
    }
  };

  const handleStudentNameChange = async (newName: string) => {
    if (!selectedStudent) return;
    const updated = await updateStudent(selectedStudent.id, { name: newName });
    if (updated) {
      setSelectedStudent(updated);
      loadStudents();
    }
  };

  return (
    <div className="panel student-cohort-panel">
      <h2>Students ({students.length})</h2>

      <div className="cohort-controls">
        <select
          value={selectedCohortId ?? ""}
          onChange={(e) => setSelectedCohortId(Number(e.target.value))}
          disabled={loading || cohorts.length === 0}
        >
          {cohorts.map((cohort) => (
            <option key={cohort.id} value={cohort.id}>
              {cohort.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => setModalOpen(true)}
          disabled={selectedCohortId === null}
        >
          Add Student
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading students...</div>
      ) : (
        <StudentTable
          students={students}
          observers={observers}
          onStudentClick={handleStudentClick}
          onDeleteStudent={handleDeleteStudent}
          onObserverChange={handleObserverChange}
        />
      )}

      <Sidebar
        isOpen={sidebarOpen}
        onClose={handleCloseSidebar}
        title={selectedStudent?.name || "Student Details"}
        onTitleChange={handleStudentNameChange}
      >
        {selectedStudent && (
          <StudentDetail
            student={selectedStudent}
            onNoteAdded={handleNoteAdded}
          />
        )}
      </Sidebar>

      <AddStudentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAddStudent}
      />
    </div>
  );
}
