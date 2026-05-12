const MAX_STRING_LENGTH = 500;

export function trackBackendEvent(env, ctx, event) {
  const task = sendAxiomEvent(env, event);

  if (ctx && typeof ctx.waitUntil === "function") {
    ctx.waitUntil(task);
    return;
  }

  task.catch(() => {});
}

export async function sendAxiomEvent(env, event) {
  const result = await sendAxiomEventDetailed(env, event);
  return result.ok;
}

export async function sendAxiomEventDetailed(env, event) {
  const url = getAxiomIngestUrl(env);
  const token = env?.AXIOM_TOKEN_BACKEND;

  if (!url || !token) {
    return {
      ok: false,
      configured: false,
      status: 0,
      endpoint: describeEndpoint(url),
      message: !url ? "Missing Axiom ingest URL" : "Missing Axiom token",
    };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        {
          time: new Date().toISOString(),
          data: sanitize({
            service: "galeria-viva-backend",
            runtime: "cloudflare-worker",
            ...event,
          }),
        },
      ]),
    });

    const text = await response.text();

    return {
      ok: response.ok,
      configured: true,
      status: response.status,
      endpoint: describeEndpoint(url),
      message: response.ok ? "Axiom accepted the event" : text.slice(0, 500),
    };
  } catch {
    return {
      ok: false,
      configured: true,
      status: 0,
      endpoint: describeEndpoint(url),
      message: "Request to Axiom failed",
    };
  }
}

export function buildRequestEvent(request, response, startedAt, extra = {}) {
  const url = new URL(request.url);

  return {
    event: "http_request",
    level: response.status >= 500 ? "error" : response.status >= 400 ? "warn" : "info",
    method: request.method,
    path: url.pathname,
    status: response.status,
    duration_ms: Date.now() - startedAt,
    user_agent: request.headers.get("user-agent") ?? "",
    referer: request.headers.get("referer") ?? "",
    colo: request.cf?.colo ?? "",
    country: request.cf?.country ?? "",
    ...extra,
  };
}

function getAxiomIngestUrl(env) {
  return env?.AXIOM_INGEST_URL || env?.VITE_AXIOM_INGEST_URL || "";
}

function describeEndpoint(url) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    return {
      host: parsed.host,
      path: parsed.pathname,
    };
  } catch {
    return {
      host: "invalid-url",
      path: "",
    };
  }
}

function sanitize(value) {
  if (value === null || value === undefined) return value;

  if (typeof value === "string") {
    return value.length > MAX_STRING_LENGTH ? `${value.slice(0, MAX_STRING_LENGTH)}...` : value;
  }

  if (typeof value === "number" || typeof value === "boolean") return value;

  if (Array.isArray(value)) return value.slice(0, 20).map(sanitize);

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, sanitize(item)]),
    );
  }

  return String(value);
}
