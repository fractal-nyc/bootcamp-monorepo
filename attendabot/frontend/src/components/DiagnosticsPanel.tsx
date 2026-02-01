/**
 * @fileoverview Diagnostics panel containing bot status, server logs, and feature requests.
 * Provides a comprehensive view of system health, activity, and planned features.
 */

import { StatusPanel } from "./StatusPanel";
import { ServerLogs } from "./ServerLogs";
import { FeatureRequestsPanel } from "./FeatureRequestsPanel";
import { FeatureFlagsPanel } from "./FeatureFlagsPanel";

/** Container component for diagnostics tab content. */
export function DiagnosticsPanel() {
  return (
    <>
      <StatusPanel />
      <FeatureFlagsPanel />
      <ServerLogs />
      <FeatureRequestsPanel />
    </>
  );
}
