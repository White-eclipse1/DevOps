import { argv, env, exit } from "node:process";

const DEFAULT_BASE = "https://paaginaludos.pages.dev/";
const baseUrl = (argv[2] || env.SMOKE_BASE_URL || DEFAULT_BASE).replace(/\/$/, "");

const checks = [
  {
    name: "Home (cliente)",
    path: "/customer",
    expectStatus: 200,
    expectText: "Galería Viva",
  },
  {
    name: "Galería pública",
    path: "/gallery",
    expectStatus: 200,
  },
  {
    name: "Vista artista (SPA fallback)",
    path: "/artist",
    expectStatus: 200,
  },
  {
    name: "Login API - credenciales válidas (cliente)",
    path: "/api/login",
    method: "POST",
    body: {
      role: "customer",
      email: "cliente@galeriaviva.local",
      password: "cliente123",
    },
    expectStatus: 200,
    expectJson: (data) => data?.ok === true && typeof data?.token === "string",
  },
  {
    name: "Login API - rechaza credenciales inválidas",
    path: "/api/login",
    method: "POST",
    body: {
      role: "customer",
      email: "fake@example.com",
      password: "wrong",
    },
    expectStatus: 401,
  },
];

async function runCheck(check) {
  const url = `${baseUrl}${check.path}`;
  const init = {
    method: check.method ?? "GET",
    headers: check.body ? { "Content-Type": "application/json" } : undefined,
    body: check.body ? JSON.stringify(check.body) : undefined,
  };

  try {
    const response = await fetch(url, init);
    const status = response.status;

    if (status !== check.expectStatus) {
      return { ok: false, name: check.name, reason: `status ${status} esperado ${check.expectStatus}` };
    }

    if (check.expectText) {
      const text = await response.text();
      if (!text.includes(check.expectText)) {
        return {
          ok: false,
          name: check.name,
          reason: `respuesta no contiene "${check.expectText}"`,
        };
      }
    } else if (check.expectJson) {
      const data = await response.json();
      if (!check.expectJson(data)) {
        return {
          ok: false,
          name: check.name,
          reason: `JSON no cumple expectativa: ${JSON.stringify(data)}`,
        };
      }
    }

    return { ok: true, name: check.name, status };
  } catch (err) {
    return { ok: false, name: check.name, reason: err.message };
  }
}

async function main() {
  console.log(`[smoke-test] Base URL: ${baseUrl}\n`);

  const results = [];
  for (const check of checks) {
    const result = await runCheck(check);
    results.push(result);
    const icon = result.ok ? "OK  " : "FAIL";
    const detail = result.ok ? "" : `  ->  ${result.reason}`;
    console.log(`[${icon}] ${result.name}${detail}`);
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n[smoke-test] ${results.length - failed.length}/${results.length} checks ok.`);

  if (failed.length > 0) {
    console.error(`[smoke-test] ${failed.length} smoke tests fallaron.`);
    exit(1);
  }
}

main();