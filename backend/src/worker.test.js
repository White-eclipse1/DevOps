import { describe, it, expect } from "vitest";
import worker, { handleLogin } from "./worker.js";

const mockEnv = {
  DB: {
    prepare: () => ({
      bind: () => ({ run: async () => {} }),
      run: async () => {},
    }),
  },
};

const mockEnvNoDB = {};

function makeRequest(method, pathname, body) {
  const url = `https://worker.test${pathname}`;
  const init = { method };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { "Content-Type": "application/json" };
  }
  return new Request(url, init);
}

describe("GET /health", () => {
  it("returns ok:true with DB binding present", async () => {
    const res = await worker.fetch(makeRequest("GET", "/health"), mockEnv);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.bindings.db).toBe(true);
  });

  it("reflects db:false when binding is absent", async () => {
    const res = await worker.fetch(makeRequest("GET", "/"), mockEnvNoDB);
    const json = await res.json();
    expect(json.bindings.db).toBe(false);
  });
});

describe("OPTIONS", () => {
  it("returns 204 with CORS headers", async () => {
    const res = await worker.fetch(makeRequest("OPTIONS", "/login"), mockEnv);
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
});

describe("POST /login", () => {
  it("returns token for valid artist credentials", async () => {
    const req = makeRequest("POST", "/login", {
      email: "artista@galeriaviva.local",
      password: "artista123",
      role: "artist",
    });
    const res = await handleLogin(req, mockEnv);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(typeof json.token).toBe("string");
    expect(json.user.role).toBe("artist");
  });

  it("returns token for valid customer credentials", async () => {
    const req = makeRequest("POST", "/login", {
      email: "cliente@galeriaviva.local",
      password: "cliente123",
      role: "customer",
    });
    const res = await handleLogin(req, mockEnv);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.user.role).toBe("customer");
  });

  it("returns 401 for wrong password", async () => {
    const req = makeRequest("POST", "/login", {
      email: "artista@galeriaviva.local",
      password: "wrongpass",
      role: "artist",
    });
    const res = await handleLogin(req, mockEnv);
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.ok).toBe(false);
  });

  it("returns 401 for invalid role", async () => {
    const req = makeRequest("POST", "/login", {
      email: "artista@galeriaviva.local",
      password: "artista123",
      role: "admin",
    });
    const res = await handleLogin(req, mockEnv);
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.ok).toBe(false);
  });

  it("returns 400 for non-JSON body", async () => {
    const req = new Request("https://worker.test/login", {
      method: "POST",
      body: "not-json",
      headers: { "Content-Type": "text/plain" },
    });
    const res = await handleLogin(req, mockEnv);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.ok).toBe(false);
  });
});

describe("Unknown routes", () => {
  it("returns 404", async () => {
    const res = await worker.fetch(makeRequest("GET", "/unknown"), mockEnv);
    expect(res.status).toBe(404);
  });
});

describe("POST /monitor", () => {
  it("accepts frontend monitoring events", async () => {
    const res = await worker.fetch(
      makeRequest("POST", "/monitor", {
        event: "debug_probe",
        level: "info",
        path: "/customer",
      }),
      mockEnv,
    );
    const json = await res.json();
    expect(res.status).toBe(202);
    expect(json.ok).toBe(true);
  });
});
