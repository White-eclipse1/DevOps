import * as Sentry from "@sentry/cloudflare";
import { buildRequestEvent, trackBackendEvent } from "./axiom.js";

const DEMO_USERS = {
  artist: {
    email: "artista@galeriaviva.local",
    password: "artista123",
    name: "Lulu Cardenas",
    role: "artist",
  },
  customer: {
    email: "cliente@galeriaviva.local",
    password: "cliente123",
    name: "Cliente demo",
    role: "customer",
  },
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const handler = {
  async fetch(request, env, ctx) {
    const startedAt = Date.now();
    const url = new URL(request.url);
    let response;

    try {
      if (request.method === "OPTIONS") {
        response = new Response(null, {
          status: 204,
          headers: corsHeaders,
        });
      } else if (url.pathname === "/" || url.pathname === "/health") {
        response = Response.json({
          ok: true,
          service: "paaginaludos-api",
          bindings: {
            db: Boolean(env.DB),
            axiom: Boolean(env.AXIOM_TOKEN_BACKEND && (env.AXIOM_INGEST_URL || env.VITE_AXIOM_INGEST_URL)),
          },
        });
      } else if (url.pathname === "/login" && request.method === "POST") {
        response = await handleLogin(request, env, ctx);
      } else if (url.pathname === "/artworks" && request.method === "GET") {
        response = await handleGetArtworks(env);
      } else if (url.pathname === "/artworks" && request.method === "PUT") {
        response = await handleUpdateArtwork(request, env);
      } else if (url.pathname === "/artworks" && request.method === "POST") {
        response = await handleCreateArtwork(request, env);
      } else if (url.pathname === "/monitor" && request.method === "POST") {
        response = await handleMonitorEvent(request, env, ctx);
      } else {
        response = new Response("Not found", { status: 404 });
      }
    } catch (error) {
      response = json({ ok: false, message: "Error interno del servidor." }, 500);
      trackBackendEvent(env, ctx, {
        event: "unhandled_error",
        level: "error",
        path: url.pathname,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }

    trackBackendEvent(env, ctx, buildRequestEvent(request, response, startedAt));
    return response;
  },
};

export default Sentry.withSentry(
  (env) => ({
    dsn: "https://1799ce5fc436c48f933aa922460eb447@o4511113714728960.ingest.us.sentry.io/4511113736224768",
    sendDefaultPii: true,
    tracesSampleRate: 1.0,
    environment: env.ENVIRONMENT ?? "production",
  }),
  handler,
);

export async function handleLogin(request, env, ctx) {
  let payload;

  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, message: "El cuerpo de la solicitud no es JSON valido." }, 400);
  }

  const role = payload.role === "artist" || payload.role === "customer" ? payload.role : null;
  const email = String(payload.email ?? "").trim().toLowerCase();
  const password = String(payload.password ?? "");
  const user = role ? DEMO_USERS[role] : null;

  if (!user || user.email !== email || user.password !== password) {
    trackBackendEvent(env, ctx, {
      event: "login_failed",
      level: "warn",
      role: role ?? "invalid",
      email_domain: email.includes("@") ? email.split("@").pop() : "",
    });
    return json({ ok: false, message: "Correo, password o rol incorrecto." }, 401);
  }

  await recordLogin(env, user, request);
  trackBackendEvent(env, ctx, {
    event: "login_success",
    level: "info",
    role: user.role,
    email_domain: user.email.split("@").pop(),
  });

  return json({
    ok: true,
    token: btoa(
      JSON.stringify({
        role: user.role,
        email: user.email,
        issuedAt: new Date().toISOString(),
      }),
    ),
    user: {
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: corsHeaders,
  });
}

export async function handleGetArtworks(env) {
  if (!env.DB) {
    return json({ ok: false, message: "Base de datos no configurada." }, 500);
  }

  const { results } = await env.DB.prepare("SELECT * FROM artworks ORDER BY year DESC").all();
  return json(results);
}

export async function handleUpdateArtwork(request, env) {
  if (!env.DB) {
    return json({ ok: false, message: "Base de datos no configurada." }, 500);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, message: "El cuerpo de la solicitud no es JSON valido." }, 400);
  }

  const { id, title, type, collection, year, medium, size, price, available, image, description } = payload;

  if (!id) {
    return json({ ok: false, message: "El ID de la obra es requerido." }, 400);
  }

  try {
    await env.DB.prepare(
      `UPDATE artworks 
       SET title = ?, type = ?, collection = ?, year = ?, medium = ?, size = ?, price = ?, available = ?, image = ?, description = ?
       WHERE id = ?`
    )
      .bind(
        title ?? null, type ?? null, collection ?? null, year ?? null, medium ?? null, size ?? null, price ?? null, available ? 1 : 0, image ?? null, description ?? null, id
      )
      .run();

    return json({ ok: true, message: "Obra actualizada correctamente." });
  } catch (error) {
    return json({ ok: false, message: "Error al actualizar la base de datos." }, 500);
  }
}

export async function handleCreateArtwork(request, env) {
  if (!env.DB) {
    return json({ ok: false, message: "Base de datos no configurada." }, 500);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, message: "El cuerpo de la solicitud no es JSON valido." }, 400);
  }

  const { id, title, type, collection, year, medium, size, price, available, image, description } = payload;

  if (!id || !title) {
    return json({ ok: false, message: "El ID y título de la obra son requeridos." }, 400);
  }

  try {
    await env.DB.prepare(
      `INSERT INTO artworks (id, title, type, collection, year, medium, size, price, available, image, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(id, title, type ?? "pintura", collection ?? null, year ?? null, medium ?? null, size ?? null, price ?? null, available ? 1 : 0, image ?? null, description ?? null)
      .run();

    return json({ ok: true, message: "Obra creada correctamente." }, 201);
  } catch (error) {
    return json({ ok: false, message: "Error al insertar en la base de datos." }, 500);
  }
}

export async function handleMonitorEvent(request, env, ctx) {
  let payload;

  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, message: "El cuerpo de la solicitud no es JSON valido." }, 400);
  }

  trackBackendEvent(env, ctx, {
    service: "galeria-viva-frontend",
    runtime: "browser-via-worker",
    event: typeof payload.event === "string" ? payload.event : "client_event",
    level: normalizeLevel(payload.level),
    path: typeof payload.path === "string" ? payload.path : "",
    route: typeof payload.route === "string" ? payload.route : "",
    role: typeof payload.role === "string" ? payload.role : "",
    message: typeof payload.message === "string" ? payload.message : "",
    metadata: sanitizeClientMetadata(payload.metadata),
    user_agent: request.headers.get("user-agent") ?? "",
    referer: request.headers.get("referer") ?? "",
    colo: request.cf?.colo ?? "",
    country: request.cf?.country ?? "",
  });

  return json({ ok: true }, 202);
}

async function recordLogin(env, user, request) {
  if (!env.DB) return;

  try {
    await env.DB.prepare(
      `
        CREATE TABLE IF NOT EXISTS login_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL,
          role TEXT NOT NULL,
          user_agent TEXT,
          created_at TEXT NOT NULL
        )
      `,
    ).run();

    await env.DB.prepare(
      `
        INSERT INTO login_events (email, role, user_agent, created_at)
        VALUES (?, ?, ?, ?)
      `,
    )
      .bind(
        user.email,
        user.role,
        request.headers.get("user-agent") ?? "",
        new Date().toISOString(),
      )
      .run();
  } catch {
    // Login should keep working even if audit persistence is unavailable.
  }
}

function normalizeLevel(level) {
  return level === "debug" || level === "info" || level === "warn" || level === "error" ? level : "info";
}

function sanitizeClientMetadata(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !["password", "token", "email"].includes(key.toLowerCase()))
      .map(([key, item]) => [key, typeof item === "string" ? item.slice(0, 500) : item]),
  );
}
