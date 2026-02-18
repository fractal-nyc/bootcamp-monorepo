/**
 * @fileoverview Simulator page route component.
 * Reads URL params to determine which simulation and flow to display.
 */

import { useParams, useNavigate } from "react-router";
import SimulatorApp from "../simulations/SimulatorApp";
import { flows } from "../simulations/flowData";
import ScalingSimulatorApp from "../simulations/ScalingSimulatorApp";
import { scalingFrames } from "../simulations/scalingData";

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

  if (kind === "scaling") {
    const frameIndex = flowId ? scalingFrames.findIndex((f) => f.id === flowId) : 0;
    const activeFrame = frameIndex >= 0 ? frameIndex : 0;

    return (
      <div className="app app-wide">
        <ScalingSimulatorApp
          activeFrame={activeFrame}
          onFrameChange={(i) => navigate(`/simulations/scaling/${scalingFrames[i].id}`)}
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
