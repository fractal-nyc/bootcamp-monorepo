import CrawlerDiagram from "./CrawlerDiagram";
import "./simulations.css";

/** Shell component for the web crawler pipeline simulation. */
export default function CrawlerSimulatorApp() {
  return (
    <>
      <h1 className="app-title">Web Crawler Pipeline</h1>
      <p className="app-subtitle">
        Step through the complete 16-step crawl sequence: from seed URL injection to
        full-text search indexing and recrawl scheduling.
      </p>
      <CrawlerDiagram />
    </>
  );
}
