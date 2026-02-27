import ScalingArchDiagram from "./ScalingArchDiagram";
import { crawlerFrames } from "./crawlerData";
import "./simulations.css";

interface CrawlerSimulatorAppProps {
  activeFrame: number;
  onFrameChange: (index: number) => void;
}

export default function CrawlerSimulatorApp({
  activeFrame,
  onFrameChange,
}: CrawlerSimulatorAppProps) {
  const frame = crawlerFrames[activeFrame];

  return (
    <>
      <h1 className="app-title">Web Crawler → LLM Training Pipeline</h1>
      <p className="app-subtitle">
        How the internet becomes a language model: from seed URLs to 15 trillion
        training tokens. Based on Common Crawl, FineWeb, and Llama 3 architecture.
      </p>

      <div className="arch-frame-indicator">
        <span className="arch-frame-number">Step {activeFrame + 1}:</span>{" "}
        {frame.title}
      </div>

      <ScalingArchDiagram
        frames={crawlerFrames}
        activeFrame={activeFrame}
        onFrameChange={onFrameChange}
      />
    </>
  );
}
