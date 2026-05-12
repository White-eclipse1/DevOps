type EventLevel = "debug" | "info" | "warn" | "error";

interface ClientEvent {
  event: string;
  level?: EventLevel;
  message?: string;
  route?: string;
  role?: string;
  metadata?: Record<string, unknown>;
}

let initialized = false;
const DEFAULT_API_URL = "https://art-worker.agentemafigue.workers.dev";

export function initFrontendMonitoring() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  trackClientEvent("app_loaded", {
    metadata: {
      path: window.location.pathname,
      mode: import.meta.env.MODE,
    },
  });

  window.addEventListener("error", (event) => {
    trackClientEvent("client_error", {
      level: "error",
      message: event.message,
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    trackClientEvent("client_unhandled_rejection", {
      level: "error",
      message: getErrorMessage(event.reason),
    });
  });
}

export function trackClientEvent(event: string, details: Omit<ClientEvent, "event"> = {}) {
  if (typeof window === "undefined" || isLocalDev()) return;

  const payload: ClientEvent & { path: string } = {
    event,
    level: details.level ?? "info",
    path: window.location.pathname,
    route: details.route,
    role: details.role,
    message: details.message,
    metadata: details.metadata,
  };

  const body = JSON.stringify(payload);

  const endpoint = getMonitorEndpoint();

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon(endpoint, blob)) return;
  }

  fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return typeof error === "string" ? error : "Unknown client error";
}

function isLocalDev() {
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}

function getMonitorEndpoint() {
  const apiUrl = import.meta.env.VITE_API_URL || DEFAULT_API_URL;
  return `${apiUrl.replace(/\/$/, "")}/monitor`;
}
