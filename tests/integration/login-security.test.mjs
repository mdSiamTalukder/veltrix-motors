import test, { before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LOGIN_MAX_FAILURES } from "../../src/lib/login-rate-limit.ts";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000";

function readDotEnvLocal() {
  try {
    const contents = readFileSync(path.join(ROOT, ".env.local"), "utf8");
    const values = {};

    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separator = trimmed.indexOf("=");

      if (separator === -1) {
        continue;
      }

      const key = trimmed.slice(0, separator).trim();
      let value = trimmed.slice(separator + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      values[key] = value;
    }

    return values;
  } catch {
    return {};
  }
}

const dotenv = readDotEnvLocal();
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? dotenv.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? dotenv.ADMIN_PASSWORD;

function nextIp() {
  const a = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `198.18.${a}.${b}`;
}

async function loginRequest({
  body,
  raw,
  contentType = "application/json",
  ip,
}) {
  const headers = { "x-forwarded-for": ip };

  if (contentType) {
    headers["content-type"] = contentType;
  }

  return fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers,
    body: raw ?? JSON.stringify(body),
    redirect: "manual",
  });
}

before(async () => {
  assert.ok(
    ADMIN_EMAIL && ADMIN_PASSWORD,
    "ADMIN_EMAIL and ADMIN_PASSWORD must be available via environment or .env.local.",
  );

  const deadline = Date.now() + 30_000;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${BASE_URL}/admin/login`, {
        redirect: "manual",
      });

      if (response.status === 200) {
        return;
      }

      lastError = new Error(`unexpected status ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(
    `Server not reachable at ${BASE_URL}. Start it with "npm run dev" or set TEST_BASE_URL. ${
      lastError instanceof Error ? lastError.message : ""
    }`,
  );
});

test("malformed JSON is rejected with 400 and a safe message", async () => {
  const response = await loginRequest({ raw: "{not-json", ip: nextIp() });

  assert.equal(response.status, 400);

  const data = await response.json();
  assert.equal(typeof data.message, "string");
  assert.equal(data.stack, undefined);
});

test("unsupported content type is rejected with 415", async () => {
  const response = await loginRequest({
    raw: "email=admin",
    contentType: "text/plain",
    ip: nextIp(),
  });

  assert.equal(response.status, 415);
});

test("empty request body is rejected with 400", async () => {
  const response = await loginRequest({ raw: "", ip: nextIp() });
  assert.equal(response.status, 400);
});

test("wrong credentials are rejected with a generic 401", async () => {
  const response = await loginRequest({
    body: { email: ADMIN_EMAIL, password: "definitely-not-the-password" },
    ip: nextIp(),
  });

  assert.equal(response.status, 401);

  const data = await response.json();
  assert.equal(data.message, "Invalid email or password.");
});

test("valid credentials return 200 and an HttpOnly session cookie", async () => {
  const response = await loginRequest({
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    ip: nextIp(),
  });

  assert.equal(response.status, 200);

  const setCookie = response.headers.get("set-cookie") ?? "";
  assert.match(setCookie, /veltrix_admin_session=/);
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=lax/i);
});

test("repeated failures block further attempts with 429", async () => {
  const ip = nextIp();

  for (let attempt = 1; attempt <= LOGIN_MAX_FAILURES; attempt += 1) {
    const response = await loginRequest({
      body: { email: ADMIN_EMAIL, password: `wrong-password-${attempt}` },
      ip,
    });

    assert.equal(response.status, 401, `attempt ${attempt} should be rejected`);
  }

  const blocked = await loginRequest({
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    ip,
  });

  assert.equal(blocked.status, 429);

  const data = await blocked.json();
  assert.match(data.message, /Too many login attempts/i);
});

test("unauthenticated visitors are redirected away from /admin/cars", async () => {
  const response = await fetch(`${BASE_URL}/admin/cars`, {
    redirect: "manual",
  });

  assert.equal(response.status, 307);
  assert.match(response.headers.get("location") ?? "", /\/admin\/login$/);
});

test("authenticated visitors can load /admin/cars", async () => {
  const login = await loginRequest({
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    ip: nextIp(),
  });

  assert.equal(login.status, 200);

  const cookie = (login.headers.get("set-cookie") ?? "").split(";")[0];
  assert.match(cookie, /^veltrix_admin_session=/);

  const response = await fetch(`${BASE_URL}/admin/cars`, {
    headers: { cookie },
    redirect: "manual",
  });

  assert.equal(response.status, 200);
});
