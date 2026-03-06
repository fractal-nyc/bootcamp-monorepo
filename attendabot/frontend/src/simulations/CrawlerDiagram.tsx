import { useState, useEffect, useCallback, useMemo } from "react";
import { crawlerNodes, crawlerEdges, crawlerSteps, NODE_W, NODE_H } from "./crawlerData";
import crawlerPng from "./web-crawler.png";
import "./simulations.css";

const HW = NODE_W / 2; // half-width: 74
const HH = NODE_H / 2; // half-height: 22
const STEP_DELAY = 2400;

/**
 * Returns the point on the box boundary (centered at fromCx, fromCy, size NODE_W x NODE_H)
 * in the direction of (toCx, toCy).
 */
function boxEdgePoint(
  fromCx: number,
  fromCy: number,
  toCx: number,
  toCy: number,
): [number, number] {
  const dx = toCx - fromCx;
  const dy = toCy - fromCy;
  if (dx === 0 && dy === 0) return [fromCx, fromCy];
  const tx = dx !== 0 ? HW / Math.abs(dx) : Infinity;
  const ty = dy !== 0 ? HH / Math.abs(dy) : Infinity;
  const t = Math.min(tx, ty);
  return [fromCx + dx * t, fromCy + dy * t];
}

export default function CrawlerDiagram() {
  const [activeStep, setActiveStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [showFullDiagram, setShowFullDiagram] = useState(false);

  // Auto-play timer
  useEffect(() => {
    if (!playing) return;
    if (activeStep >= crawlerSteps.length - 1) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setActiveStep((s) => s + 1), STEP_DELAY);
    return () => clearTimeout(t);
  }, [playing, activeStep]);

  const play = useCallback(() => {
    if (activeStep >= crawlerSteps.length - 1) setActiveStep(-1);
    setTimeout(() => {
      setActiveStep((s) => (s < 0 ? 0 : s));
      setPlaying(true);
    }, 50);
  }, [activeStep]);

  const next = useCallback(() => {
    setPlaying(false);
    setActiveStep((s) => Math.min(s + 1, crawlerSteps.length - 1));
  }, []);

  const prev = useCallback(() => {
    setPlaying(false);
    setActiveStep((s) => Math.max(s - 1, -1));
  }, []);

  const reset = useCallback(() => {
    setPlaying(false);
    setActiveStep(-1);
  }, []);

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

  const nodeMap = useMemo(() => {
    const map: Record<string, (typeof crawlerNodes)[0]> = {};
    for (const n of crawlerNodes) map[n.id] = n;
    return map;
  }, []);

  const currentStep = activeStep >= 0 ? crawlerSteps[activeStep] : null;
  const activeEdgeIds = useMemo(() => new Set(currentStep?.edges ?? []), [currentStep]);
  const activeNodeIds = useMemo(() => new Set(currentStep?.nodes ?? []), [currentStep]);
  const stepColor = currentStep?.color ?? "#6366f1";

  // Build a map of edge → last step color it was activated in (for "past" dim state)
  const pastEdgeColors = useMemo(() => {
    const info: Record<string, string> = {};
    for (let i = 0; i < activeStep; i++) {
      for (const eid of crawlerSteps[i].edges) {
        info[eid] = crawlerSteps[i].color;
      }
    }
    return info;
  }, [activeStep]);

  const isSeedStep = currentStep?.num === "1";
  const workerNode = nodeMap["worker"];

  return (
    <div className="flow-diagram">
      <div className="flow-layout">
        {/* ── Sidebar: controls + description ── */}
        <div className="flow-sidebar">
          <div className="controls">
            <button onClick={reset} className="ctrl-btn" title="Reset (R)">
              Reset
            </button>
            <button
              onClick={prev}
              className="ctrl-btn"
              disabled={activeStep < 0}
              title="Previous (←)"
            >
              ◀
            </button>
            {playing ? (
              <button onClick={() => setPlaying(false)} className="ctrl-btn ctrl-primary">
                Pause
              </button>
            ) : (
              <button onClick={play} className="ctrl-btn ctrl-primary" title="Play (Space)">
                Play ▶
              </button>
            )}
            <button
              onClick={next}
              className="ctrl-btn"
              disabled={activeStep >= crawlerSteps.length - 1}
              title="Next (→)"
            >
              ▶
            </button>
            <button
              onClick={() => setShowFullDiagram((v) => !v)}
              className={`ctrl-btn${showFullDiagram ? " ctrl-primary" : ""}`}
            >
              Full Diagram
            </button>
            <span className="step-counter">
              {activeStep >= 0
                ? `${activeStep + 1} / ${crawlerSteps.length}`
                : `${crawlerSteps.length} steps`}
            </span>
          </div>

          <div className="desc-panel visible">
            {currentStep ? (
              <>
                <div style={{ marginBottom: "var(--space-2)" }}>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: "var(--text-lg)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: stepColor,
                    }}
                  >
                    Step {currentStep.num}:
                  </span>{" "}
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: "var(--text-lg)",
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                    }}
                  >
                    {currentStep.label}
                  </span>
                </div>
                <p className="desc-text">{currentStep.description}</p>
                {currentStep.payload && (
                  <pre className="desc-payload">{currentStep.payload}</pre>
                )}
              </>
            ) : (
              <div className="flow-header">
                <h2>Web Crawler Pipeline</h2>
                <p className="flow-subtitle">
                  Step through the complete 16-step crawl sequence: from seed URL injection
                  to full-text indexing and recrawl scheduling.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Main: SVG architecture diagram or full PNG ── */}
        <div className="flow-main">
          {showFullDiagram ? (
            <img
              src={crawlerPng}
              alt="Web crawler full architecture diagram"
              style={{ width: "100%", display: "block", border: "2px solid var(--color-charcoal)", boxShadow: "4px 4px 0 rgba(0,0,0,0.15)" }}
            />
          ) : null}
          <svg
            viewBox="0 0 910 665"
            style={{ width: "100%", display: showFullDiagram ? "none" : "block" }}
            aria-label="Web crawler architecture diagram"
          >
            <defs>
              {/* Arrowhead that inherits the line's stroke color (SVG 2 context-stroke) */}
              <marker
                id="arrow"
                viewBox="0 0 10 7"
                refX="9"
                refY="3.5"
                markerWidth="6"
                markerHeight="5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="context-stroke" />
              </marker>
            </defs>

            {/* ── Edges (rendered before nodes so nodes draw on top) ── */}
            {crawlerEdges.map((edge) => {
              if (edge.from === edge.to) return null; // self-loop handled separately

              const fromNode = nodeMap[edge.from];
              const toNode = nodeMap[edge.to];
              if (!fromNode || !toNode) return null;

              const [x1, y1] = boxEdgePoint(fromNode.cx, fromNode.cy, toNode.cx, toNode.cy);
              const [x2, y2] = boxEdgePoint(toNode.cx, toNode.cy, fromNode.cx, fromNode.cy);

              const isActive = activeEdgeIds.has(edge.id);
              const pastColor = pastEdgeColors[edge.id];

              let stroke: string;
              let strokeWidth: number;
              let opacity: number;

              if (isActive) {
                stroke = stepColor;
                strokeWidth = 2.5;
                opacity = 1;
              } else if (pastColor) {
                stroke = pastColor;
                strokeWidth = 1.5;
                opacity = 0.3;
              } else {
                stroke = "#cbd5e1";
                strokeWidth = 1.5;
                opacity = 1;
              }

              return (
                <line
                  key={edge.id}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  opacity={opacity}
                  markerEnd="url(#arrow)"
                />
              );
            })}

            {/* ── Worker self-loop (step 6: fetch & process) ── */}
            {(() => {
              const isSelfActive = activeEdgeIds.has("worker→worker");
              const pastColor = pastEdgeColors["worker→worker"];
              const stroke = isSelfActive ? stepColor : pastColor ? pastColor : "#cbd5e1";
              const sw = isSelfActive ? 2.5 : 1.5;
              const opacity = pastColor && !isSelfActive ? 0.3 : 1;
              const rx = workerNode.cx + HW; // right edge: 514

              return (
                <g opacity={opacity}>
                  <path
                    d={`M ${rx},${workerNode.cy - 10} C ${rx + 58},${workerNode.cy - 48} ${rx + 58},${workerNode.cy + 48} ${rx},${workerNode.cy + 10}`}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={sw}
                    markerEnd="url(#arrow)"
                  />
                  {isSelfActive && (
                    <text
                      x={rx + 62}
                      y={workerNode.cy}
                      textAnchor="start"
                      dominantBaseline="middle"
                      fontSize="9"
                      fontWeight="700"
                      fill={stepColor}
                      fontFamily="inherit"
                      style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}
                    >
                      fetch &amp; parse
                    </text>
                  )}
                </g>
              );
            })()}

            {/* ── Seed arrow (step 1 only: external → frontier) ── */}
            {isSeedStep && (
              <g>
                <text
                  x={440}
                  y={8}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="700"
                  fill={stepColor}
                  fontFamily="inherit"
                  style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}
                >
                  seed
                </text>
                <line
                  x1={440}
                  y1={13}
                  x2={440}
                  y2={31}
                  stroke={stepColor}
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  markerEnd="url(#arrow)"
                />
              </g>
            )}

            {/* ── Nodes ── */}
            {crawlerNodes.map((node) => {
              const isActive = activeNodeIds.has(node.id);
              const fill = isActive ? node.color + "1a" : "#f8fafc";
              const strokeColor = isActive ? node.color : "#334155";
              const sw = isActive ? 2.5 : 1.5;

              return (
                <g key={node.id}>
                  <rect
                    x={node.cx - HW}
                    y={node.cy - HH}
                    width={NODE_W}
                    height={NODE_H}
                    fill={fill}
                    stroke={strokeColor}
                    strokeWidth={sw}
                    rx={3}
                  />
                  <text
                    x={node.cx}
                    y={node.cy - (node.sublabel ? 5 : 0)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill={isActive ? node.color : "#1e293b"}
                    fontFamily="inherit"
                    style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}
                  >
                    {node.label}
                  </text>
                  {node.sublabel && (
                    <text
                      x={node.cx}
                      y={node.cy + 11}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="9"
                      fill={isActive ? node.color : "#64748b"}
                      fontFamily="inherit"
                    >
                      {node.sublabel}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
