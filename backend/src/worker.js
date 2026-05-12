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

/** Structured JSON for Tail Worker / Axiom: one line per log. */
export function logEvent(env, level, msg, extra = {}) {
  const release = env.CF_VERSION_METADATA?.id ?? null;
  const row = {
    ts: new Date().toISOString(),
    source: "art-worker",
    environment: env.ENVIRONMENT ?? "production",
    release,
    level,
    msg,
    ...extra,
  };
  const line = JSON.stringify(row);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: corsHeaders,
        });
      }

      if (url.pathname === "/" || url.pathname === "/health") {
        logEvent(env, "info", "health_ok", { path: url.pathname, method: request.method });
        return Response.json({
          ok: true,
          service: "paaginaludos-api",
          bindings: {
            db: Boolean(env.DB),
          },
        });
      }

      if (url.pathname === "/axiom-test") {
        logEvent(env, "info", "axiom_test_throw", {
          note: "intentional uncaught exception for Tail/Axiom verification",
        });
        throw new Error("Axiom test: exception should appear in Tail ingest");
      }

      if (url.pathname === "/login" && request.method === "POST") {
        return await handleLogin(request, env, url);
      }

      if (url.pathname === "/artworks" && request.method === "GET") {
        return await handleGetArtworks(env);
      }

      if (url.pathname === "/artworks" && request.method === "PUT") {
        return await handleUpdateArtwork(request, env);
      }

      if (url.pathname === "/artworks" && request.method === "POST") {
        return await handleCreateArtwork(request, env);
      }

      logEvent(env, "info", "not_found", { path: url.pathname, method: request.method });
      return new Response("Not found", { status: 404 });
    } catch (err) {
      logEvent(env, "error", "fetch_unhandled", {
        path: url.pathname,
        method: request.method,
        err: err?.stack ?? String(err),
      });
      return json({ ok: false, message: "Error interno del servidor." }, 500);
    }
  },
};

export async function handleLogin(request, env, url = new URL(request.url)) {
  let payload;

  try {
    payload = await request.json();
  } catch (err) {
    logEvent(env, "warn", "login_invalid_json", {
      handler: "login",
      err: err?.stack ?? String(err),
    });
    return json({ ok: false, message: "El cuerpo de la solicitud no es JSON valido." }, 400);
  }

  try {
    const role = payload.role === "artist" || payload.role === "customer" ? payload.role : null;
    const email = String(payload.email ?? "").trim().toLowerCase();
    const password = String(payload.password ?? "");
    const user = role ? DEMO_USERS[role] : null;

    if (!user || user.email !== email || user.password !== password) {
      logEvent(env, "warn", "login_failed", { path: url.pathname, role: role ?? "invalid" });
      return json({ ok: false, message: "Correo, password o rol incorrecto." }, 401);
    }

    await recordLogin(env, user, request);

    logEvent(env, "info", "login_ok", { path: url.pathname, role: user.role });
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
  } catch (err) {
    logEvent(env, "error", "login_unhandled", {
      path: url.pathname,
      err: err?.stack ?? String(err),
    });
    return json({ ok: false, message: "Error interno en login." }, 500);
  }
}

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: corsHeaders,
  });
}

export async function handleGetArtworks(env) {
  if (!env.DB) {
    logEvent(env, "error", "db_missing_get_artworks", { handler: "get_artworks" });
    return json({ ok: false, message: "Base de datos no configurada." }, 500);
  }

  try {
    const db = env.DB;
    const { results } = await db.prepare("SELECT * FROM artworks ORDER BY year DESC").all();
    return json(results);
  } catch (err) {
    logEvent(env, "error", "get_artworks_failed", {
      handler: "get_artworks",
      err: err?.stack ?? String(err),
    });
    return json({ ok: false, message: "Error al consultar la base de datos." }, 500);
  }
}

export async function handleUpdateArtwork(request, env) {
  if (!env.DB) {
    logEvent(env, "error", "db_missing_update_artwork", { handler: "update_artwork" });
    return json({ ok: false, message: "Base de datos no configurada." }, 500);
  }

  let payload;
  try {
    payload = await request.json();
  } catch (err) {
    logEvent(env, "warn", "update_artwork_invalid_json", {
      handler: "update_artwork",
      err: err?.stack ?? String(err),
    });
    return json({ ok: false, message: "El cuerpo de la solicitud no es JSON valido." }, 400);
  }

  const { id, title, type, collection, year, medium, size, price, available, image, description } =
    payload;

  if (!id) {
    return json({ ok: false, message: "El ID de la obra es requerido." }, 400);
  }

  try {
    const db = env.DB;
    await db
      .prepare(
        `UPDATE artworks 
       SET title = ?, type = ?, collection = ?, year = ?, medium = ?, size = ?, price = ?, available = ?, image = ?, description = ?
       WHERE id = ?`,
      )
      .bind(
        title ?? null,
        type ?? null,
        collection ?? null,
        year ?? null,
        medium ?? null,
        size ?? null,
        price ?? null,
        available ? 1 : 0,
        image ?? null,
        description ?? null,
        id,
      )
      .run();

    logEvent(env, "info", "artwork_updated", { handler: "update_artwork", artworkId: id });
    return json({ ok: true, message: "Obra actualizada correctamente." });
  } catch (err) {
    logEvent(env, "error", "update_artwork_failed", {
      handler: "update_artwork",
      artwork_id: id,
      err: err?.stack ?? String(err),
    });
    return json({ ok: false, message: "Error al actualizar la base de datos." }, 500);
  }
}

export async function handleCreateArtwork(request, env) {
  if (!env.DB) {
    logEvent(env, "error", "db_missing_create_artwork", { handler: "create_artwork" });
    return json({ ok: false, message: "Base de datos no configurada." }, 500);
  }

  let payload;
  try {
    payload = await request.json();
  } catch (err) {
    logEvent(env, "warn", "create_artwork_invalid_json", {
      handler: "create_artwork",
      err: err?.stack ?? String(err),
    });
    return json({ ok: false, message: "El cuerpo de la solicitud no es JSON valido." }, 400);
  }

  const { id, title, type, collection, year, medium, size, price, available, image, description } =
    payload;

  if (!id || !title) {
    return json({ ok: false, message: "El ID y título de la obra son requeridos." }, 400);
  }

  try {
    const db = env.DB;
    await db
      .prepare(
        `INSERT INTO artworks (id, title, type, collection, year, medium, size, price, available, image, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        title,
        type ?? "pintura",
        collection ?? null,
        year ?? null,
        medium ?? null,
        size ?? null,
        price ?? null,
        available ? 1 : 0,
        image ?? null,
        description ?? null,
      )
      .run();

    logEvent(env, "info", "artwork_created", { handler: "create_artwork", artworkId: id });
    return json({ ok: true, message: "Obra creada correctamente." }, 201);
  } catch (err) {
    logEvent(env, "error", "create_artwork_failed", {
      handler: "create_artwork",
      artwork_id: id,
      err: err?.stack ?? String(err),
    });
    return json({ ok: false, message: "Error al insertar en la base de datos." }, 500);
  }
}

async function recordLogin(env, user, request) {
  if (!env.DB) return;

  try {
    const db = env.DB;
    await db
      .prepare(
        `
        CREATE TABLE IF NOT EXISTS login_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL,
          role TEXT NOT NULL,
          user_agent TEXT,
          created_at TEXT NOT NULL
        )
      `,
      )
      .run();

    await db
      .prepare(
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
  } catch (err) {
    logEvent(env, "warn", "record_login_failed", {
      component: "recordLogin",
      err: err?.stack ?? String(err),
    });
  }
}
