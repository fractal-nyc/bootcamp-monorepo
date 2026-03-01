/**
 * @fileoverview GSAP + SVG animation of the web crawler inner loop:
 * Frontier → Worker → Database → Link Extractor → Frontier (repeat)
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import "./simulations.css";

gsap.registerPlugin(MotionPathPlugin);

// Timing constants (seconds)
const TRAVEL = 0.9;  // time for a packet to travel one arrow
const PAUSE = 0.25;  // pause after arriving at a node

// SVG layout (viewBox 0 0 720 400)
// Box centers:
//   Frontier:      (100, 200)
//   Worker:        (360,  80)
//   Database:      (620, 200)
//   LinkExtractor: (360, 320)

export default function CrawlerAnimation() {
  const svgRef = useRef<SVGSVGElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    // Initial state: all dots invisible, boxes at rest
    gsap.set(
      ["#dot-url", "#dot-data", "#dot-links", "#dot-newurl"],
      { opacity: 0 },
    );

    const boxIds = [
      "#box-frontier",
      "#box-worker",
      "#box-db",
      "#box-extractor",
    ];
    gsap.set(boxIds, { fill: "#f8f8f6" });

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.4 });
    tlRef.current = tl;

    // ── Phase 1: URL packet leaves Frontier → Worker ──────────────────────
    tl.set("#dot-url", { opacity: 1 })
      .to("#box-frontier", { fill: "#dbeafe", duration: 0.15 })
      .to("#dot-url", {
        duration: TRAVEL,
        motionPath: { path: "#path-f-to-w", align: "#path-f-to-w" },
        ease: "power2.inOut",
      })
      .set("#dot-url", { opacity: 0 })
      .to("#box-frontier", { fill: "#f8f8f6", duration: 0.2 })
      .to("#box-worker", { fill: "#d1fae5", duration: 0.15 }, "<")
      .to({}, { duration: PAUSE })
      .to("#box-worker", { fill: "#f8f8f6", duration: 0.2 });

    // ── Phase 2: Data packet leaves Worker → Database ─────────────────────
    tl.set("#dot-data", { opacity: 1 })
      .to("#box-worker", { fill: "#dbeafe", duration: 0.15 })
      .to("#dot-data", {
        duration: TRAVEL,
        motionPath: { path: "#path-w-to-db", align: "#path-w-to-db" },
        ease: "power2.inOut",
      })
      .set("#dot-data", { opacity: 0 })
      .to("#box-worker", { fill: "#f8f8f6", duration: 0.2 })
      .to("#box-db", { fill: "#d1fae5", duration: 0.15 }, "<")
      .to({}, { duration: PAUSE })
      .to("#box-db", { fill: "#f8f8f6", duration: 0.2 });

    // ── Phase 3: Links packet leaves Database → Link Extractor ────────────
    tl.set("#dot-links", { opacity: 1 })
      .to("#box-db", { fill: "#dbeafe", duration: 0.15 })
      .to("#dot-links", {
        duration: TRAVEL,
        motionPath: { path: "#path-db-to-ex", align: "#path-db-to-ex" },
        ease: "power2.inOut",
      })
      .set("#dot-links", { opacity: 0 })
      .to("#box-db", { fill: "#f8f8f6", duration: 0.2 })
      .to("#box-extractor", { fill: "#d1fae5", duration: 0.15 }, "<")
      .to({}, { duration: PAUSE })
      .to("#box-extractor", { fill: "#f8f8f6", duration: 0.2 });

    // ── Phase 4: New URL packet leaves Link Extractor → Frontier ──────────
    tl.set("#dot-newurl", { opacity: 1 })
      .to("#box-extractor", { fill: "#dbeafe", duration: 0.15 })
      .to("#dot-newurl", {
        duration: TRAVEL,
        motionPath: { path: "#path-ex-to-f", align: "#path-ex-to-f" },
        ease: "power2.inOut",
      })
      .set("#dot-newurl", { opacity: 0 })
      .to("#box-extractor", { fill: "#f8f8f6", duration: 0.2 })
      .to("#box-frontier", { fill: "#d1fae5", duration: 0.15 }, "<")
      .to({}, { duration: PAUSE })
      .to("#box-frontier", { fill: "#f8f8f6", duration: 0.2 });

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <>
      <h1 className="app-title">Web Crawler — Core Loop</h1>
      <p className="app-subtitle">
        Workers pull URLs from the frontier, crawl them, store the content,
        extract new links, and feed them back into the queue.
      </p>

      <svg
        ref={svgRef}
        viewBox="0 0 720 400"
        style={{ width: "100%", maxWidth: 900, display: "block" }}
        aria-label="Web crawler loop diagram"
      >
        <defs>
          {/* Arrowhead marker */}
          <marker
            id="arrow"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L0,6 L8,3 z" fill="#64748b" />
          </marker>
        </defs>

        {/* ── Arrow paths (visible + used for MotionPath) ──────────────── */}

        {/* Frontier → Worker */}
        <path
          id="path-f-to-w"
          d="M 168,178 C 220,140 290,100 292,97"
          fill="none"
          stroke="#64748b"
          strokeWidth="2"
          markerEnd="url(#arrow)"
        />
        {/* Worker → Database */}
        <path
          id="path-w-to-db"
          d="M 428,97 C 430,100 500,140 552,178"
          fill="none"
          stroke="#64748b"
          strokeWidth="2"
          markerEnd="url(#arrow)"
        />
        {/* Database → Link Extractor */}
        <path
          id="path-db-to-ex"
          d="M 552,222 C 500,260 430,300 428,303"
          fill="none"
          stroke="#64748b"
          strokeWidth="2"
          markerEnd="url(#arrow)"
        />
        {/* Link Extractor → Frontier */}
        <path
          id="path-ex-to-f"
          d="M 292,303 C 290,300 220,260 168,222"
          fill="none"
          stroke="#64748b"
          strokeWidth="2"
          markerEnd="url(#arrow)"
        />

        {/* ── Arrow labels ─────────────────────────────────────────────── */}
        <text x="218" y="122" textAnchor="middle" fontSize="11" fontWeight="700"
          fill="#475569" textLength="70" fontFamily="inherit">PULL URL</text>
        <text x="506" y="122" textAnchor="middle" fontSize="11" fontWeight="700"
          fill="#475569" textLength="90" fontFamily="inherit">STORE CONTENT</text>
        <text x="506" y="296" textAnchor="middle" fontSize="11" fontWeight="700"
          fill="#475569" textLength="102" fontFamily="inherit">EXTRACT LINKS</text>
        <text x="218" y="296" textAnchor="middle" fontSize="11" fontWeight="700"
          fill="#475569" textLength="90" fontFamily="inherit">ADD NEW URLS</text>

        {/* ── Boxes ────────────────────────────────────────────────────── */}

        {/* URL Frontier */}
        <rect id="box-frontier" x="30" y="165" width="140" height="70"
          fill="#f8f8f6" stroke="#1a1a1a" strokeWidth="2.5" />
        <text x="100" y="194" textAnchor="middle" fontSize="11" fontWeight="700"
          fill="#1a1a1a" fontFamily="inherit" textLength="90" letterSpacing="1">URL FRONTIER</text>
        <text x="100" y="212" textAnchor="middle" fontSize="10"
          fill="#64748b" fontFamily="inherit">queue of pending</text>
        <text x="100" y="225" textAnchor="middle" fontSize="10"
          fill="#64748b" fontFamily="inherit">URLs to crawl</text>

        {/* Worker */}
        <rect id="box-worker" x="290" y="47" width="140" height="60"
          fill="#f8f8f6" stroke="#1a1a1a" strokeWidth="2.5" />
        <text x="360" y="73" textAnchor="middle" fontSize="11" fontWeight="700"
          fill="#1a1a1a" fontFamily="inherit" textLength="56" letterSpacing="1">WORKER</text>
        <text x="360" y="91" textAnchor="middle" fontSize="10"
          fill="#64748b" fontFamily="inherit">fetches &amp; parses</text>
        <text x="360" y="104" textAnchor="middle" fontSize="10"
          fill="#64748b" fontFamily="inherit">the page HTML</text>

        {/* Database */}
        <rect id="box-db" x="550" y="165" width="140" height="70"
          fill="#f8f8f6" stroke="#1a1a1a" strokeWidth="2.5" />
        <text x="620" y="194" textAnchor="middle" fontSize="11" fontWeight="700"
          fill="#1a1a1a" fontFamily="inherit" textLength="72" letterSpacing="1">DATABASE</text>
        <text x="620" y="212" textAnchor="middle" fontSize="10"
          fill="#64748b" fontFamily="inherit">stores page text,</text>
        <text x="620" y="225" textAnchor="middle" fontSize="10"
          fill="#64748b" fontFamily="inherit">metadata &amp; status</text>

        {/* Link Extractor */}
        <rect id="box-extractor" x="290" y="293" width="140" height="60"
          fill="#f8f8f6" stroke="#1a1a1a" strokeWidth="2.5" />
        <text x="360" y="318" textAnchor="middle" fontSize="11" fontWeight="700"
          fill="#1a1a1a" fontFamily="inherit" textLength="110" letterSpacing="1">LINK EXTRACTOR</text>
        <text x="360" y="336" textAnchor="middle" fontSize="10"
          fill="#64748b" fontFamily="inherit">finds &lt;a href&gt; links</text>
        <text x="360" y="349" textAnchor="middle" fontSize="10"
          fill="#64748b" fontFamily="inherit">in the fetched HTML</text>

        {/* ── Animated dots ─────────────────────────────────────────────── */}

        {/* dot-url: travels Frontier → Worker (blue) */}
        <circle id="dot-url" r="7" fill="#3b82f6" stroke="#1e40af" strokeWidth="1.5" opacity="0" />

        {/* dot-data: travels Worker → Database (green) */}
        <circle id="dot-data" r="7" fill="#10b981" stroke="#065f46" strokeWidth="1.5" opacity="0" />

        {/* dot-links: travels Database → Link Extractor (orange) */}
        <circle id="dot-links" r="7" fill="#f59e0b" stroke="#92400e" strokeWidth="1.5" opacity="0" />

        {/* dot-newurl: travels Link Extractor → Frontier (purple) */}
        <circle id="dot-newurl" r="7" fill="#8b5cf6" stroke="#4c1d95" strokeWidth="1.5" opacity="0" />
      </svg>
    </>
  );
}
