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
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Contexto que se adjunta a cualquier evento de esta request
    Sentry.setTag("path", url.pathname);
    Sentry.setTag("method", request.method);

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
          sentry: Boolean(env.SENTRY_DSN),
        },
      });
    }

    // Endpoint de prueba: tira un error a proposito para verificar que Sentry recibe eventos.
    // Borrar despues de validar el setup.
    if (url.pathname === "/sentry-test") {
      throw new Error("Sentry test: este error debe aparecer en el dashboard");
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
    // DSN viene de wrangler.toml [vars] o secret, no hardcodeado
    dsn: env.SENTRY_DSN,
    // Asocia los eventos con la version desplegada (requiere binding CF_VERSION_METADATA)
    release: env.CF_VERSION_METADATA?.id,
    environment: env.ENVIRONMENT ?? "production",
    sendDefaultPii: true,
    tracesSampleRate: 1.0,
    // Manda console.log/console.error a Sentry tambien
    enableLogs: true,
  }),
  handler,
);

export async function handleLogin(request, env) {
  let payload;

  try {
    payload = await request.json();
  } catch (error) {
    Sentry.captureException(error, { tags: { handler: "login", step: "parse_body" } });
    return json({ ok: false, message: "El cuerpo de la solicitud no es JSON valido." }, 400);
  }

  const role = payload.role === "artist" || payload.role === "customer" ? payload.role : null;
  const email = String(payload.email ?? "").trim().toLowerCase();
  const password = String(payload.password ?? "");
  const user = role ? DEMO_USERS[role] : null;

  if (!user || user.email !== email || user.password !== password) {
    Sentry.addBreadcrumb({
      category: "auth",
      message: `Login fallido para ${email}`,
      level: "warning",
    });
    return json({ ok: false, message: "Correo, password o rol incorrecto." }, 401);
  }

  // Asocia el usuario a los eventos posteriores en esta request
  Sentry.setUser({ email: user.email, role: user.role });

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
    Sentry.captureMessage("DB binding faltante en handleGetArtworks", "error");
    return json({ ok: false, message: "Base de datos no configurada." }, 500);
  }

  try {
    // instrumentD1WithSentry hace que cada query aparezca como span en el dashboard
    const db = Sentry.instrumentD1WithSentry(env.DB);
    const { results } = await db.prepare("SELECT * FROM artworks ORDER BY year DESC").all();
    return json(results);
  } catch (error) {
    Sentry.captureException(error, { tags: { handler: "get_artworks" } });
    return json({ ok: false, message: "Error al consultar la base de datos." }, 500);
  }
}

export async function handleUpdateArtwork(request, env) {
  if (!env.DB) {
    Sentry.captureMessage("DB binding faltante en handleUpdateArtwork", "error");
    return json({ ok: false, message: "Base de datos no configurada." }, 500);
  }

  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    Sentry.captureException(error, { tags: { handler: "update_artwork", step: "parse_body" } });
    return json({ ok: false, message: "El cuerpo de la solicitud no es JSON valido." }, 400);
  }

  const { id, title, type, collection, year, medium, size, price, available, image, description } = payload;

  if (!id) {
    return json({ ok: false, message: "El ID de la obra es requerido." }, 400);
  }

  try {
    const db = Sentry.instrumentD1WithSentry(env.DB);
    await db.prepare(
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
    Sentry.captureException(error, {
      tags: { handler: "update_artwork", artwork_id: id },
    });
    return json({ ok: false, message: "Error al actualizar la base de datos." }, 500);
  }
}

export async function handleCreateArtwork(request, env) {
  if (!env.DB) {
    Sentry.captureMessage("DB binding faltante en handleCreateArtwork", "error");
    return json({ ok: false, message: "Base de datos no configurada." }, 500);
  }

  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    Sentry.captureException(error, { tags: { handler: "create_artwork", step: "parse_body" } });
    return json({ ok: false, message: "El cuerpo de la solicitud no es JSON valido." }, 400);
  }

  const { id, title, type, collection, year, medium, size, price, available, image, description } = payload;

  if (!id || !title) {
    return json({ ok: false, message: "El ID y título de la obra son requeridos." }, 400);
  }

  try {
    const db = Sentry.instrumentD1WithSentry(env.DB);
    await db.prepare(
      `INSERT INTO artworks (id, title, type, collection, year, medium, size, price, available, image, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(id, title, type ?? "pintura", collection ?? null, year ?? null, medium ?? null, size ?? null, price ?? null, available ? 1 : 0, image ?? null, description ?? null)
      .run();

    return json({ ok: true, message: "Obra creada correctamente." }, 201);
  } catch (error) {
    Sentry.captureException(error, {
      tags: { handler: "create_artwork", artwork_id: id },
    });
    return json({ ok: false, message: "Error al insertar en la base de datos." }, 500);
  }
}

async function recordLogin(env, user, request) {
  if (!env.DB) return;

  try {
    const db = Sentry.instrumentD1WithSentry(env.DB);
    await db.prepare(
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

    await db.prepare(
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
  } catch (error) {
    // El login no debe fallar si la auditoria falla, pero si queremos saber que paso
    Sentry.captureException(error, {
      level: "warning",
      tags: { component: "recordLogin" },
    });
  }
}