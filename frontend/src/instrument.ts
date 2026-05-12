/**
 * Lightweight Axiom ingest client (browser). Requires ingest-only tokens and CORS-compatible origins.
 */

const MAX_BATCH = 20;
const FLUSH_INTERVAL_MS = 5000;

const ingestUrl =
  typeof import.meta.env.VITE_AXIOM_INGEST_URL === "string"
    ? import.meta.env.VITE_AXIOM_INGEST_URL.trim()
    : "";
const token =
  typeof import.meta.env.VITE_AXIOM_TOKEN === "string"
    ? import.meta.env.VITE_AXIOM_TOKEN.trim()
    : "";

const queue: Record<string, unknown>[] = [];
let timeoutId: ReturnType<typeof setTimeout> | null = null;

function configured(): boolean {
  return ingestUrl.length > 0 && token.length > 0;
}

function clearScheduled(): void {
  if (timeoutId !== null) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
}

function scheduleFlush(): void {
  if (timeoutId !== null || !configured()) return;
  timeoutId = setTimeout(() => {
    timeoutId = null;
    void flush();
  }, FLUSH_INTERVAL_MS);
}

async function flush(): Promise<void> {
  if (!configured()) return;
  clearScheduled();
  if (queue.length === 0) return;
  const batch = queue.splice(0, queue.length);
  try {
    await fetch(ingestUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(batch),
    });
  } catch {
    // Best-effort: drop batch on failure
  }
}

function flushKeepalive(): void {
  if (!configured()) return;
  clearScheduled();
  if (queue.length === 0) return;
  const batch = queue.splice(0, queue.length);
  void fetch(ingestUrl, {
    method: "POST",
    keepalive: true,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(batch),
  });
}

export function enqueueEvent(row: Record<string, unknown>): void {
  if (!configured()) return;
  queue.push({ ts: new Date().toISOString(), ...row });
  if (queue.length >= MAX_BATCH) {
    void flush();
    return;
  }
  scheduleFlush();
}

export function logEvent(level: string, msg: string, extra: Record<string, unknown> = {}): void {
  enqueueEvent({
    source: "galeria-frontend",
    type: "log",
    level,
    msg,
    ...extra,
  });
}

export function captureException(error: unknown, extra: Record<string, unknown> = {}): void {
  const msg =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Unknown error";
  const stack =
    error instanceof Error
      ? error.stack
      : typeof error === "object" && error !== null && "stack" in error
        ? String((error as { stack?: unknown }).stack)
        : undefined;
  enqueueEvent({
    source: "galeria-frontend",
    type: "exception",
    level: "error",
    msg,
    stack,
    ...extra,
  });
}

function initBrowserClient(): void {
  if (!configured()) return;
  window.addEventListener("error", (event) => {
    captureException(event.error ?? event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });
  window.addEventListener("unhandledrejection", (event) => {
    captureException(event.reason, { reason: "unhandledrejection" });
  });
  window.addEventListener("pagehide", () => flushKeepalive());
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushKeepalive();
  });
}

initBrowserClient();
