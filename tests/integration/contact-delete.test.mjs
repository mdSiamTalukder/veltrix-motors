import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const CONTACTS_FILE = path.join(ROOT, "data/contacts.json");

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

let cookie = "";
const createdIds = new Set();

function nextIp() {
  const a = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `203.0.${a}.${b}`;
}

function readCookie(response) {
  const setCookies =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [response.headers.get("set-cookie")].filter(Boolean);

  return setCookies[0]?.split(";")[0] ?? "";
}

async function waitForServer() {
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
}

async function login() {
  const response = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": nextIp(),
    },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
    redirect: "manual",
  });

  assert.equal(response.status, 200, "admin login should succeed");
  cookie = readCookie(response);
  assert.match(cookie, /^veltrix_admin_session=/);
}

async function listContacts() {
  const response = await fetch(`${BASE_URL}/api/contact`, {
    headers: { cookie },
  });

  assert.equal(response.status, 200, "contact list should be available");
  const data = await response.json();
  return data.contacts;
}

async function createTestContact(label) {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const response = await fetch(`${BASE_URL}/api/contact`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": nextIp(),
    },
    body: JSON.stringify({
      name: "Delete API Test",
      email: `delete-test-${stamp}@example.com`,
      phone: "",
      subject: "Delete API verification",
      message: `Temporary contact message for ${label} (${stamp})`,
      company: "",
    }),
  });

  assert.equal(response.status, 201, "test contact should be accepted");
  const data = await response.json();
  const id = data.submission?.id;
  assert.equal(typeof id, "string", "created contact should include an id");
  createdIds.add(id);
  return id;
}

async function deleteRequest(id, { authenticated = true } = {}) {
  return fetch(`${BASE_URL}/api/contact/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: authenticated ? { cookie } : {},
    redirect: "manual",
  });
}

async function deleteIfStillPresent(id) {
  try {
    await deleteRequest(id);
  } catch {
    // Best-effort cleanup only.
  }
}

before(async () => {
  assert.ok(
    ADMIN_EMAIL && ADMIN_PASSWORD,
    "ADMIN_EMAIL and ADMIN_PASSWORD must be available via environment or .env.local.",
  );

  await waitForServer();
  await login();
});

after(async () => {
  for (const id of createdIds) {
    await deleteIfStillPresent(id);
  }
});

test("unauthenticated deletion is rejected", async () => {
  const response = await deleteRequest(
    "msg-00000000-0000-4000-8000-000000000000",
    { authenticated: false },
  );

  assert.equal(response.status, 401);
});

test("invalid identifiers are rejected without touching storage", async () => {
  const before = (await listContacts()).map((contact) => contact.id);

  const response = await deleteRequest("invalid id");

  assert.equal(response.status, 400);

  const data = await response.json();
  assert.match(data.message, /invalid/i);

  const after = (await listContacts()).map((contact) => contact.id);
  assert.deepEqual(after, before);
});

test("nonexistent messages return 404 without touching storage", async () => {
  const before = (await listContacts()).map((contact) => contact.id);

  const response = await deleteRequest(
    "msg-00000000-0000-4000-8000-000000000000",
  );

  assert.equal(response.status, 404);

  const data = await response.json();
  assert.match(data.message, /not found/i);

  const after = (await listContacts()).map((contact) => contact.id);
  assert.deepEqual(after, before);
});

test("deletes only the selected message and preserves every other message", async () => {
  const beforeIds = (await listContacts()).map((contact) => contact.id);

  const id = await createTestContact("successful deletion");
  assert.ok(!beforeIds.includes(id), "test message id should be unique");

  const withTest = await listContacts();
  assert.ok(withTest.some((contact) => contact.id === id));

  const response = await deleteRequest(id);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true });
  createdIds.delete(id);

  const afterIds = (await listContacts()).map((contact) => contact.id);
  assert.ok(!afterIds.includes(id), "test message should be deleted");

  for (const originalId of beforeIds) {
    assert.ok(
      afterIds.includes(originalId),
      `existing message ${originalId} should be preserved`,
    );
  }

  const stored = JSON.parse(readFileSync(CONTACTS_FILE, "utf8"));
  assert.ok(
    !stored.some((contact) => contact.id === id),
    "test message should be removed from JSON storage",
  );

  for (const originalId of beforeIds) {
    assert.ok(
      stored.some((contact) => contact.id === originalId),
      `existing message ${originalId} should remain in JSON storage`,
    );
  }
});
