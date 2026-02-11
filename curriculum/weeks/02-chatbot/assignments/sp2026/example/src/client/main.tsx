/**
 * React entry point.
 *
 * This file mounts our root <App /> component into the DOM element
 * with id="root" (defined in index.html). StrictMode enables extra
 * development warnings for common React pitfalls.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App.js";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
