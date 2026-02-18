import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { ScalingFrame, ArchNode, ArchEdge } from "./scalingTypes";

interface ArchDiagramProps {
  frames: ScalingFrame[];
  activeFrame: number;
  onFrameChange: (index: number) => void;
}

const PLAY_DELAY = 3000;

export default function ArchDiagram({ frames, activeFrame, onFrameChange }: ArchDiagramProps) {
  const [playing, setPlaying] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const frame = frames[activeFrame];

  // Auto-play timer
  useEffect(() => {
    if (!playing) return;
    if (activeFrame >= frames.length - 1) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => onFrameChange(activeFrame + 1), PLAY_DELAY);
    return () => clearTimeout(t);
  }, [playing, activeFrame, frames.length, onFrameChange]);

  const play = useCallback(() => {
    if (activeFrame >= frames.length - 1) onFrameChange(0);
    setTimeout(() => {
      setPlaying(true);
    }, 50);
  }, [activeFrame, frames.length, onFrameChange]);

  const next = useCallback(() => {
    setPlaying(false);
    onFrameChange(Math.min(activeFrame + 1, frames.length - 1));
  }, [activeFrame, frames.length, onFrameChange]);

  const prev = useCallback(() => {
    setPlaying(false);
    onFrameChange(Math.max(activeFrame - 1, 0));
  }, [activeFrame, onFrameChange]);

  const reset = useCallback(() => {
    setPlaying(false);
    onFrameChange(0);
  }, [onFrameChange]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "r") {
        reset();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev, reset]);

  // Build a lookup for node positions to draw edges
  const nodeMap = useMemo(() => {
    const map: Record<string, ArchNode> = {};
    for (const n of frame.nodes) map[n.id] = n;
    return map;
  }, [frame.nodes]);

  // Track previous frame to detect new nodes
  const prevFrameRef = useRef<string>("");
  const isNewFrame = prevFrameRef.current !== frame.id;
  useEffect(() => {
    prevFrameRef.current = frame.id;
  }, [frame.id]);

  return (
    <div className="flow-diagram">
      {/* Controls row */}
      <div className="controls">
        <button onClick={reset} className="ctrl-btn" title="Reset (R)">
          Reset
        </button>
        <button
          onClick={prev}
          className="ctrl-btn"
          disabled={activeFrame <= 0}
          title="Previous"
        >
          {"\u25C0"}
        </button>
        {playing ? (
          <button
            onClick={() => setPlaying(false)}
            className="ctrl-btn ctrl-primary"
          >
            Pause
          </button>
        ) : (
          <button onClick={play} className="ctrl-btn ctrl-primary" title="Play (Space)">
            Play {"\u25B6"}
          </button>
        )}
        <button
          onClick={next}
          className="ctrl-btn"
          disabled={activeFrame >= frames.length - 1}
          title="Next"
        >
          {"\u25B6"}
        </button>
        <span className="step-counter">
          {activeFrame + 1} / {frames.length}
        </span>
      </div>

      <div className="arch-layout">
        {/* Left: architecture diagram (takes most space) */}
        <div className="arch-diagram-col">
          <div className="arch-canvas" ref={canvasRef}>
            {/* Groups (dashed containers) */}
            {frame.groups?.map((g) => (
              <div
                key={g.id}
                className="arch-group"
                style={{
                  left: `${g.x}%`,
                  top: `${g.y}%`,
                  width: `${g.width}%`,
                  height: `${g.height}%`,
                }}
              >
                <span className="arch-group-label">{g.label}</span>
              </div>
            ))}

            {/* SVG edges */}
            <svg ref={svgRef} className="arch-edges">
              <defs>
                <marker
                  id="arch-arrowhead"
                  markerWidth="8"
                  markerHeight="6"
                  refX="7"
                  refY="3"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 8 3, 0 6"
                    fill="var(--color-slate)"
                  />
                </marker>
                <marker
                  id="arch-arrowhead-dashed"
                  markerWidth="8"
                  markerHeight="6"
                  refX="7"
                  refY="3"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 8 3, 0 6"
                    fill="var(--color-line)"
                  />
                </marker>
              </defs>
              {frame.edges.map((edge, i) => (
                <EdgeLine key={`${edge.from}-${edge.to}-${i}`} edge={edge} nodeMap={nodeMap} />
              ))}
            </svg>

            {/* Nodes */}
            {frame.nodes.map((node) => {
              const isNew = isNewFrame && frame.newNodeIds?.includes(node.id);
              return (
                <div
                  key={node.id}
                  className={`arch-node ${isNew ? "new" : ""}`}
                  style={{
                    left: `${node.x}%`,
                    top: `${node.y}%`,
                    borderColor: node.color,
                  }}
                >
                  <span className="arch-node-icon">{node.icon}</span>
                  <span className="arch-node-label">{node.label}</span>
                  {node.detail && (
                    <span className="arch-node-detail">{node.detail}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: description panel */}
        <div className="arch-sidebar-col">
          <div className="desc-panel visible">
            {frame.changeSummary && (
              <p className="arch-change-summary">{frame.changeSummary}</p>
            )}
            <p className="desc-text">{frame.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Find where a ray from box center toward a target point exits the box boundary.
 * halfW/halfH are in the same percentage coordinate space as cx/cy/tx/ty.
 */
function clipToBox(
  cx: number, cy: number,
  tx: number, ty: number,
  halfW: number, halfH: number,
): [number, number] {
  const dx = tx - cx;
  const dy = ty - cy;
  if (dx === 0 && dy === 0) return [cx, cy];
  const sx = dx !== 0 ? halfW / Math.abs(dx) : Infinity;
  const sy = dy !== 0 ? halfH / Math.abs(dy) : Infinity;
  const s = Math.min(sx, sy);
  return [cx + dx * s, cy + dy * s];
}

// Approximate node half-size in percentage coordinates
const NODE_HALF_W = 5;
const NODE_HALF_H = 5.5;

/** Renders a single SVG edge line between two nodes. */
function EdgeLine({
  edge,
  nodeMap,
}: {
  edge: ArchEdge;
  nodeMap: Record<string, ArchNode>;
}) {
  const from = nodeMap[edge.from];
  const to = nodeMap[edge.to];
  if (!from || !to) return null;

  const off = edge.offsetY ?? 0;
  const fromX = from.x;
  const fromY = from.y + off;
  const toX = to.x;
  const toY = to.y + off;

  // Clip line to box edges
  const [x1, y1] = clipToBox(fromX, fromY, toX, toY, NODE_HALF_W, NODE_HALF_H);
  const [x2, y2] = clipToBox(toX, toY, fromX, fromY, NODE_HALF_W, NODE_HALF_H);

  const isDashed = edge.style === "dashed";
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  return (
    <g>
      <line
        x1={`${x1}%`}
        y1={`${y1}%`}
        x2={`${x2}%`}
        y2={`${y2}%`}
        stroke={isDashed ? "var(--color-line)" : "var(--color-slate)"}
        strokeWidth={isDashed ? 1.5 : 2}
        strokeDasharray={isDashed ? "6 4" : undefined}
        markerEnd={isDashed ? "url(#arch-arrowhead-dashed)" : "url(#arch-arrowhead)"}
      />
      {edge.label && (
        <text
          x={`${midX}%`}
          y={`${midY}%`}
          className="arch-edge-label"
          textAnchor="middle"
          dy="-6"
        >
          {edge.label}
        </text>
      )}
    </g>
  );
}
