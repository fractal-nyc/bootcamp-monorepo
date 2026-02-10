/**
 * @fileoverview Student portal route component.
 */

import { StudentPortal } from "../components/StudentPortal";
import { useAuth } from "../hooks/useAuth";

/** Student dashboard route. */
export function StudentPage() {
  const { username, sessionInvalid, logout, studentCohortDates } = useAuth();

  return (
    <StudentPortal
      username={username}
      sessionInvalid={sessionInvalid}
      onLogout={logout}
      cohortStartDate={studentCohortDates.startDate}
      cohortEndDate={studentCohortDates.endDate}
    />
  );
}
