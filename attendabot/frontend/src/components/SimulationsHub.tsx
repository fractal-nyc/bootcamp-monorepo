/**
 * @fileoverview Displays available simulations as cards with links.
 */

const simulations = [
  {
    id: "auth",
    title: "Auth Flow Simulator",
    description: "Interactive animations of common authentication systems",
    url: "/simulations/auth/",
  },
];

/** Renders a grid of available simulation cards. */
export function SimulationsHub() {
  return (
    <div className="panel" style={{ gridColumn: "span 2" }}>
      <h2>Simulations</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "var(--space-5)" }}>
        {simulations.map((sim) => (
          <div
            key={sim.id}
            style={{
              background: "var(--color-white)",
              border: "2px solid var(--color-charcoal)",
              padding: "var(--space-5)",
              boxShadow: "4px 4px 0 rgba(0, 0, 0, 0.15)",
            }}
          >
            <h3 style={{
              margin: "0 0 var(--space-3) 0",
              fontSize: "var(--text-base)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}>
              {sim.title}
            </h3>
            <p style={{
              color: "var(--color-slate)",
              fontSize: "var(--text-base)",
              margin: "0 0 var(--space-5) 0",
              lineHeight: "1.6",
            }}>
              {sim.description}
            </p>
            <button
              className="primary-btn"
              onClick={() => window.open(sim.url, "_blank")}
            >
              Open
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
