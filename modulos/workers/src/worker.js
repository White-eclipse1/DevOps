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
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
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

    return new Response("Not found", { status: 404 });
  },
};

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
