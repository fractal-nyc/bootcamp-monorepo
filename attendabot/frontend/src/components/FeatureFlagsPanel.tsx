/**
 * @fileoverview Panel for viewing and toggling feature flags.
 */

import { useState, useEffect, useCallback } from "react";
import type { FeatureFlag } from "../api/client";
import {
  getFeatureFlags,
  updateFeatureFlag as apiUpdateFeatureFlag,
} from "../api/client";

/** Panel for managing feature flags with toggle switches. */
export function FeatureFlagsPanel() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadFlags = useCallback(async () => {
    setLoading(true);
    const data = await getFeatureFlags();
    setFlags(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadFlags();
  }, [loadFlags]);

  const handleToggle = async (key: string, currentEnabled: boolean) => {
    setUpdating(key);
    const updated = await apiUpdateFeatureFlag(key, !currentEnabled);
    if (updated) {
      setFlags((prev) =>
        prev.map((f) => (f.key === key ? updated : f))
      );
    }
    setUpdating(null);
  };

  const formatKey = (key: string) => {
    return key
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  return (
    <div className="panel feature-flags-panel">
      <h2>Feature Flags</h2>

      {loading ? (
        <div className="loading">Loading feature flags...</div>
      ) : flags.length === 0 ? (
        <div className="no-students">No feature flags configured</div>
      ) : (
        <div className="ff-list">
          {flags.map((flag) => (
            <div key={flag.key} className="ff-item">
              <div className="ff-info">
                <span className="ff-name">{formatKey(flag.key)}</span>
                <span className="ff-description">{flag.description}</span>
              </div>
              <button
                className={`ff-toggle ${flag.enabled ? "enabled" : "disabled"}`}
                onClick={() => handleToggle(flag.key, flag.enabled)}
                disabled={updating === flag.key}
              >
                {updating === flag.key
                  ? "..."
                  : flag.enabled
                    ? "ON"
                    : "OFF"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
