/** Node in the web crawler architecture diagram. */
export interface CrawlerNode {
  id: string;
  label: string;
  sublabel?: string;
  cx: number; // SVG center x
  cy: number; // SVG center y
  color: string; // highlight color (hex)
}

/** Directed edge between two nodes. */
export interface CrawlerEdge {
  id: string;
  from: string; // node id
  to: string; // node id
}

/** One step in the 16-step crawl pipeline. */
export interface CrawlerStep {
  num: string; // "1", "2", "12a", etc.
  label: string; // short label shown in the step indicator
  description: string;
  payload?: string; // optional code snippet
  edges: string[]; // edge ids to highlight
  nodes: string[]; // node ids to highlight
  color: string; // highlight color for this step
}
