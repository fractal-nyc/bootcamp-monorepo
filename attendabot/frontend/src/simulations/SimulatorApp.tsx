import { useState } from "react";
import FlowDiagram from "./FlowDiagram";
import { flows } from "./flowData";

export default function SimulatorApp() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <>
      <h1 className="app-title">Auth Flow Simulator</h1>
      <p className="app-subtitle">
        Interactive animations of common authentication systems
      </p>

      <div className="tab-bar">
        {flows.map((flow, i) => (
          <button
            key={flow.id}
            className={`tab-btn ${i === activeTab ? "active" : ""}`}
            onClick={() => setActiveTab(i)}
          >
            {flow.title}
          </button>
        ))}
      </div>

      <FlowDiagram flow={flows[activeTab]} />
    </>
  );
}
