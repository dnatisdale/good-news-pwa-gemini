import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
// Import the new service worker registration file
import { register } from "./serviceWorkerRegistration";

// We don't need these here anymore, App.jsx handles its own imports
// import { app, auth, db } from './firebaseConfig';

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Call the registration function
register();
