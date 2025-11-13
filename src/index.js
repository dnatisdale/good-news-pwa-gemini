import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
// Import the components we need to ensure the initialization runs
import { app, auth, db } from "./firebaseConfig";

// We don't need to call initializeAppIfNeeded here anymore because
// the import above already triggers the initialization and exports.

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
