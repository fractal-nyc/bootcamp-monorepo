import AuthFlowDiagram from "./AuthFlowDiagram";
import { flows } from "./authData";
import "./simulations.css";

interface SimulatorAppProps {
  activeTab: number;
  onTabChange: (index: number) => void;
}

export default function SimulatorApp({ activeTab, onTabChange }: SimulatorAppProps) {
  return (
    <>
      <h1 className="app-title">Auth Flow Simulator</h1>
      <p className="app-subtitle">
        Interactive animations of common authentication systems
      </p>

      <nav className="tab-navigation">
        {flows.map((flow, i) => (
          <button
            key={flow.id}
            className={`tab-btn ${i === activeTab ? "active" : ""}`}
            onClick={() => onTabChange(i)}
          >
            {flow.title}
          </button>
        ))}
      </nav>

      <AuthFlowDiagram flow={flows[activeTab]} />
    </>
  );
}
