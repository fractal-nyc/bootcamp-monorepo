import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../index.css";
import "./simulations.css";
import SimulatorApp from "./SimulatorApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SimulatorApp />
  </StrictMode>
);
