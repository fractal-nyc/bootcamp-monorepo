/**
 * @fileoverview Testing panel for simulating bot features.
 * Includes the Morning Briefing test panel.
 */

import { useState, useEffect } from "react";
import { getCohorts, sendTestBriefing, sendTestEodPreview } from "../api/client";
import type { Cohort } from "../api/client";

/** Panel for testing bot features like the daily briefing. */
export function TestingPanel() {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [selectedCohortId, setSelectedCohortId] = useState<number | null>(null);
  const [simulatedDate, setSimulatedDate] = useState<string>(() => {
    // Default to today's date in YYYY-MM-DD format
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // EOD Assignment Preview state
  const [eodSimulatedDate, setEodSimulatedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [eodLoading, setEodLoading] = useState(false);
  const [eodResult, setEodResult] = useState<{
    success: boolean;
    message: string;
    preview?: string;
  } | null>(null);

  useEffect(() => {
    getCohorts().then((c) => {
      setCohorts(c);
      if (c.length > 0) {
        setSelectedCohortId(c[0].id);
      }
    });
  }, []);

  const handleSendBriefing = async () => {
    if (!selectedCohortId) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await sendTestBriefing(selectedCohortId, simulatedDate);
      setResult(res);
    } catch {
      setResult({ success: false, message: "Network error" });
    } finally {
      setLoading(false);
    }
  };

  const handleEodPreview = async () => {
    setEodLoading(true);
    setEodResult(null);

    try {
      const res = await sendTestEodPreview(eodSimulatedDate);
      setEodResult(res);
    } catch {
      setEodResult({ success: false, message: "Network error" });
    } finally {
      setEodLoading(false);
    }
  };

  return (
    <div className="testing-panel">
      <section className="panel">
        <h2>Morning Briefing Test</h2>
        <p className="panel-description">
          Simulate sending a morning briefing. The simulated date is the day the cron would run,
          so the briefing will show data from the <strong>previous day</strong>.
        </p>

        <div className="form-row">
          <label htmlFor="cohort-select">Cohort:</label>
          <select
            id="cohort-select"
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
        </div>

        <div className="form-row">
          <label htmlFor="date-select">Simulated "Today" (cron run date):</label>
          <input
            id="date-select"
            type="date"
            value={simulatedDate}
            onChange={(e) => setSimulatedDate(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form-row">
          <button
            onClick={handleSendBriefing}
            disabled={loading || !selectedCohortId}
            className="primary-btn"
          >
            {loading ? "Sending..." : "Send Test Briefing to #bot-test"}
          </button>
        </div>

        {result && (
          <div className={`result-message ${result.success ? "success" : "error"}`}>
            {result.message}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>EOD Assignment Preview Test</h2>
        <p className="panel-description">
          Preview what tomorrow's assignment message will look like for a given date.
          The message will be sent to #bot-test.
        </p>

        <div className="form-row">
          <label htmlFor="eod-date-select">Simulated Date (EOD cron run date):</label>
          <input
            id="eod-date-select"
            type="date"
            value={eodSimulatedDate}
            onChange={(e) => setEodSimulatedDate(e.target.value)}
            disabled={eodLoading}
          />
        </div>

        <div className="form-row">
          <button
            onClick={handleEodPreview}
            disabled={eodLoading}
            className="primary-btn"
          >
            {eodLoading ? "Sending..." : "Send EOD Preview to #bot-test"}
          </button>
        </div>

        {eodResult && (
          <div className={`result-message ${eodResult.success ? "success" : "error"}`}>
            {eodResult.message}
            {eodResult.preview && (
              <pre className="preview-box">{eodResult.preview}</pre>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
