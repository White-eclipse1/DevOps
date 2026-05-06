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

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function onRequestPost({ request, env }) {
  let payload;

  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, message: "El cuerpo de la solicitud no es JSON valido." }, 400);
  }

  const role = normalizeRole(payload.role);
  const email = String(payload.email ?? "").trim().toLowerCase();
  const password = String(payload.password ?? "");
  const user = role ? DEMO_USERS[role] : null;

  if (!user || user.email !== email || user.password !== password) {
    return json({ ok: false, message: "Correo, password o rol incorrecto." }, 401);
  }

  await recordLogin(env, user, request);

  return json({
    ok: true,
    token: createDemoToken(user),
    user: {
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}

export async function onRequest() {
  return json({ ok: false, message: "Metodo no permitido." }, 405);
}

function normalizeRole(value) {
  if (value === "artist" || value === "customer") return value;
  return null;
}

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: corsHeaders,
  });
}

function createDemoToken(user) {
  const data = JSON.stringify({
    role: user.role,
    email: user.email,
    issuedAt: new Date().toISOString(),
  });

  return btoa(data);
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
    // Login should keep working even if the audit table is unavailable.
  }
}
