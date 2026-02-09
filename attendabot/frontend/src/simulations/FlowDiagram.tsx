import { useState, useEffect, useMemo, useCallback } from "react";
import type { AuthFlow } from "./types";

const STEP_DELAY = 1800;
const ROW_HEIGHT = 56;

export default function FlowDiagram({ flow }: { flow: AuthFlow }) {
  const [activeStep, setActiveStep] = useState(-1);
  const [playing, setPlaying] = useState(false);

  // Reset when flow changes
  useEffect(() => {
    setActiveStep(-1);
    setPlaying(false);
  }, [flow.id]);

  // Auto-play timer
  useEffect(() => {
    if (!playing) return;
    if (activeStep >= flow.steps.length - 1) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setActiveStep((s) => s + 1), STEP_DELAY);
    return () => clearTimeout(t);
  }, [playing, activeStep, flow.steps.length]);

  const play = useCallback(() => {
    if (activeStep >= flow.steps.length - 1) setActiveStep(-1);
    setTimeout(() => {
      setActiveStep((s) => (s < 0 ? 0 : s));
      setPlaying(true);
    }, 50);
  }, [activeStep, flow.steps.length]);

  const next = useCallback(() => {
    setPlaying(false);
    setActiveStep((s) => Math.min(s + 1, flow.steps.length - 1));
  }, [flow.steps.length]);

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

  // Entity center positions as percentages
  const centers = useMemo(() => {
    const map: Record<string, number> = {};
    flow.entities.forEach((e, i) => {
      map[e.id] = ((i + 0.5) / flow.entities.length) * 100;
    });
    return map;
  }, [flow.entities]);

  const diagramHeight = flow.steps.length * ROW_HEIGHT + 20;

  const currentStep = activeStep >= 0 ? flow.steps[activeStep] : null;

  return (
    <div className="flow-diagram">
      <div className="flow-layout">
        {/* ── Left sidebar: controls, description, pros/cons ── */}
        <div className="flow-sidebar">
          {/* Controls */}
          <div className="controls">
            <button onClick={reset} className="ctrl-btn" title="Reset (R)">
              Reset
            </button>
            <button
              onClick={prev}
              className="ctrl-btn"
              disabled={activeStep < 0}
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
              disabled={activeStep >= flow.steps.length - 1}
              title="Next"
            >
              {"\u25B6"}
            </button>
            <span className="step-counter">
              {activeStep >= 0
                ? `${activeStep + 1} / ${flow.steps.length}`
                : `${flow.steps.length} steps`}
            </span>
          </div>

          {/* Description panel */}
          <div className="desc-panel visible">
            {currentStep ? (
              <>
                <p className="desc-text">{currentStep.description}</p>
                {currentStep.payload && (
                  <pre className="desc-payload">{currentStep.payload}</pre>
                )}
              </>
            ) : (
              <div className="flow-header">
                <h2>{flow.title}</h2>
                <p className="flow-subtitle">{flow.subtitle}</p>
              </div>
            )}
          </div>

          {/* Pros & Cons */}
          <div className="pros-cons">
            <div className="pros-col">
              <h3>Pros</h3>
              <ul>
                {flow.pros.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
            <div className="cons-col">
              <h3>Cons</h3>
              <ul>
                {flow.cons.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ── Right main: sequence diagram ── */}
        <div className="flow-main">
          {/* Entity headers */}
          <div className="entity-row">
            {flow.entities.map((ent) => (
              <div
                key={ent.id}
                className="entity-box"
                style={
                  {
                    "--entity-color": ent.color,
                    width: `${100 / flow.entities.length}%`,
                  } as React.CSSProperties
                }
              >
                <span className="entity-icon">{ent.icon}</span>
                <span className="entity-label">{ent.label}</span>
              </div>
            ))}
          </div>

          {/* Sequence diagram area */}
          <div className="seq-area" style={{ height: diagramHeight }}>
            {/* Lifelines */}
            {flow.entities.map((ent) => (
              <div
                key={ent.id}
                className="lifeline"
                style={{
                  left: `${centers[ent.id]}%`,
                  borderColor: ent.color + "30",
                }}
              />
            ))}

            {/* Lifeline dots at each step */}
            {flow.steps.map((step, i) => (
              <div key={`dots-${i}`}>
                {flow.entities.map((ent) => (
                  <div
                    key={ent.id}
                    className={`lifeline-dot ${i <= activeStep ? "visible" : ""} ${
                      (step.from === ent.id || step.to === ent.id) &&
                      i === activeStep
                        ? "active"
                        : ""
                    }`}
                    style={{
                      left: `${centers[ent.id]}%`,
                      top: i * ROW_HEIGHT + ROW_HEIGHT / 2,
                      backgroundColor:
                        step.from === ent.id || step.to === ent.id
                          ? ent.color
                          : ent.color + "50",
                    }}
                  />
                ))}
              </div>
            ))}

            {/* Arrows */}
            {flow.steps.map((step, i) => {
              if (i > activeStep) return null;

              const fromX = centers[step.from];
              const toX = centers[step.to];
              const isSelf = step.from === step.to;

              if (isSelf) {
                const cx = fromX;
                const loopW = 10;
                return (
                  <div
                    key={i}
                    className={`self-arrow ${i === activeStep ? "active" : "past"}`}
                    style={{
                      left: `${cx}%`,
                      top: i * ROW_HEIGHT + 8,
                      width: `${loopW}%`,
                      height: ROW_HEIGHT - 16,
                      borderColor: step.color || "var(--accent)",
                    }}
                  >
                    <span
                      className="arrow-label"
                      style={{ color: step.color || "var(--accent)" }}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              }

              const isLTR = fromX < toX;
              const left = Math.min(fromX, toX);
              const width = Math.abs(toX - fromX);

              return (
                <div
                  key={i}
                  className={`arrow-row ${i === activeStep ? "active" : "past"} ${
                    isLTR ? "ltr" : "rtl"
                  }`}
                  style={{ top: i * ROW_HEIGHT + ROW_HEIGHT / 2 - 1 }}
                >
                  <div
                    className="arrow-line"
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      backgroundColor: step.color || "var(--accent)",
                    }}
                  >
                    <span className="arrow-label">{step.label}</span>
                    <span
                      className="arrow-head"
                      style={
                        isLTR
                          ? { borderLeftColor: step.color || "var(--accent)" }
                          : { borderRightColor: step.color || "var(--accent)" }
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
