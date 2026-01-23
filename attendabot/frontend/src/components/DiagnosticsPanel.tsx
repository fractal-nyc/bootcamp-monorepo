/**
 * @fileoverview Diagnostics panel containing bot status and server logs.
 * Provides a comprehensive view of system health and activity.
 */

import { StatusPanel } from "./StatusPanel";
import { ServerLogs } from "./ServerLogs";

/** Container component for diagnostics tab content. */
export function DiagnosticsPanel() {
  return (
    <>
      <StatusPanel />
      <ServerLogs />
    </>
  );
}
