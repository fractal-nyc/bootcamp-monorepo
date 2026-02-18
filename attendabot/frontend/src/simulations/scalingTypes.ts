/** Data model for the System Scaling architecture evolution simulation. */

export interface ArchNode {
  id: string;
  label: string;
  icon: string;
  color: string;
  /** X position as percentage (0–100) of the canvas width. */
  x: number;
  /** Y position as percentage (0–100) of the canvas height. */
  y: number;
  /** Optional group this node belongs to. */
  group?: string;
  /** Optional smaller secondary label (e.g. "10.0.0.1"). */
  detail?: string;
}

export interface ArchGroup {
  id: string;
  label: string;
  /** Top-left X as percentage. */
  x: number;
  /** Top-left Y as percentage. */
  y: number;
  /** Width as percentage. */
  width: number;
  /** Height as percentage. */
  height: number;
}

export interface ArchEdge {
  from: string;
  to: string;
  label?: string;
  style?: "solid" | "dashed";
  /** Vertical offset in percentage points to separate parallel edges. */
  offsetY?: number;
}

export interface ScalingFrame {
  id: string;
  title: string;
  description: string;
  /** What changed from the previous frame. */
  changeSummary?: string;
  nodes: ArchNode[];
  groups?: ArchGroup[];
  edges: ArchEdge[];
  /** IDs of nodes that are new in this frame (highlighted on entry). */
  newNodeIds?: string[];
}
