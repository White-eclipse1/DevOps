import "./instrument";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import "../assets/css/styles.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<p>Algo salió mal. El error fue reportado.</p>}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
);
