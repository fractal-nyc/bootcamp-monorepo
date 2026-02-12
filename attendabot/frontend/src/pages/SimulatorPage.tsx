/**
 * @fileoverview Simulator page route component.
 * Reads URL params to determine which simulation and flow to display.
 */

import { useParams, useNavigate } from "react-router";
import SimulatorApp from "../simulations/SimulatorApp";
import { flows } from "../simulations/flowData";

/** Thin wrapper that maps URL params to SimulatorApp props. */
export function SimulatorPage() {
  const { kind, flowId } = useParams();
  const navigate = useNavigate();

  if (kind === "auth") {
    const flowIndex = flowId ? flows.findIndex((f) => f.id === flowId) : 0;
    const activeTab = flowIndex >= 0 ? flowIndex : 0;

    return (
      <div className="app">
        <SimulatorApp
          activeTab={activeTab}
          onTabChange={(i) => navigate(`/simulations/auth/${flows[i].id}`)}
        />
      </div>
    );
  }

  return (
    <div className="app">
      <p>Unknown simulation: {kind}</p>
    </div>
  );
}
