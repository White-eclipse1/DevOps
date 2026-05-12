import * as Sentry from "@sentry/cloudflare";

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
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    if (url.pathname === "/" || url.pathname === "/health") {
      return Response.json({
        ok: true,
        service: "paaginaludos-api",
        bindings: {
          db: Boolean(env.DB),
        },
      });
    }

    if (url.pathname === "/login" && request.method === "POST") {
      return handleLogin(request, env);
    }

    if (url.pathname === "/artworks" && request.method === "GET") {
      return handleGetArtworks(env);
    }

    if (url.pathname === "/artworks" && request.method === "PUT") {
      return handleUpdateArtwork(request, env);
    }

    if (url.pathname === "/artworks" && request.method === "POST") {
      return handleCreateArtwork(request, env);
    }

    return new Response("Not found", { status: 404 });
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

export async function handleLogin(request, env) {
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
    return json({ ok: false, message: "Correo, password o rol incorrecto." }, 401);
  }

  await recordLogin(env, user, request);

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
