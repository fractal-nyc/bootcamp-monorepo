import ArchDiagram from "./ArchDiagram";
import { scalingFrames } from "./scalingData";
import "./simulations.css";

interface ScalingSimulatorAppProps {
  activeFrame: number;
  onFrameChange: (index: number) => void;
}

export default function ScalingSimulatorApp({
  activeFrame,
  onFrameChange,
}: ScalingSimulatorAppProps) {
  const frame = scalingFrames[activeFrame];

  return (
    <>
      <h1 className="app-title">Scale From Zero to Millions</h1>
      <p className="app-subtitle">
        Watch a web architecture evolve from a single server to global
        infrastructure. Based on "System Design Interview Volume 1" by Alex Xu.
      </p>

      <div className="arch-frame-indicator">
        <span className="arch-frame-number">Stage {activeFrame + 1}:</span>{" "}
        {frame.title}
      </div>

      <ArchDiagram
        frames={scalingFrames}
        activeFrame={activeFrame}
        onFrameChange={onFrameChange}
      />
    </>
  );
}
