import "./instrument";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../assets/css/styles.css";
import { ErrorBoundary } from "./ErrorBoundary";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary fallback={<p>Algo salió mal. El error fue reportado.</p>}>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
