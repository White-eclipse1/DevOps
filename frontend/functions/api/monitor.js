const MAX_EVENT_BYTES = 16_000;
const MAX_STRING_LENGTH = 500;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function onRequestPost({ request, env }) {
  const ingestUrl = env.VITE_AXIOM_INGEST_URL || env.AXIOM_INGEST_URL;
  const token = env.AXIOM_TOKEN_FRONTEND;

  if (!ingestUrl || !token) {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  const rawBody = await request.text();
  if (rawBody.length > MAX_EVENT_BYTES) {
    return json({ ok: false, message: "Evento demasiado grande." }, 413);
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ ok: false, message: "El cuerpo de la solicitud no es JSON valido." }, 400);
  }

  const event = sanitize({
    service: "galeria-viva-frontend",
    runtime: "cloudflare-pages",
    event: typeof payload.event === "string" ? payload.event : "client_event",
    level: normalizeLevel(payload.level),
    path: typeof payload.path === "string" ? payload.path : "",
    route: typeof payload.route === "string" ? payload.route : "",
    role: typeof payload.role === "string" ? payload.role : "",
    message: typeof payload.message === "string" ? payload.message : "",
    metadata: typeof payload.metadata === "object" && payload.metadata !== null ? payload.metadata : {},
    user_agent: request.headers.get("user-agent") ?? "",
    referer: request.headers.get("referer") ?? "",
    colo: request.cf?.colo ?? "",
    country: request.cf?.country ?? "",
  });

  try {
    const response = await fetch(ingestUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        {
          time: new Date().toISOString(),
          data: event,
        },
      ]),
    });

    if (!response.ok) {
      return json({ ok: false, message: "Axiom rechazo el evento." }, 502);
    }

    return json({ ok: true }, 202);
  } catch {
    return json({ ok: false, message: "No se pudo enviar el evento a Axiom." }, 502);
  }
}

export async function onRequest() {
  return json({ ok: false, message: "Metodo no permitido." }, 405);
}

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: corsHeaders,
  });
}

function normalizeLevel(level) {
  return level === "debug" || level === "info" || level === "warn" || level === "error" ? level : "info";
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
      Object.entries(value)
        .filter(([key]) => !["password", "token", "email"].includes(key.toLowerCase()))
        .map(([key, item]) => [key, sanitize(item)]),
    );
  }

  return String(value);
}
