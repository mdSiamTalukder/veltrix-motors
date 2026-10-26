
import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";

export const COOKIE_NAME = "veltrix_admin_session";
export const SESSION_DURATION = 8 * 60 * 60 * 1000;

type AdminSession = {
  email: string;
  exp: number;
};

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is missing in .env.local");
  }

  return secret;
}

function sign(payload: string) {
  return createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");
}

export function createAdminToken(email: string) {
  const payload = Buffer.from(
    JSON.stringify({
      email,
      exp: Date.now() + SESSION_DURATION,
    }),
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

export function verifyAdminToken(token: string): AdminSession | null {
  try {
    const [payload, signature, ...rest] = token.split(".");

    if (!payload || !signature || rest.length > 0) return null;

    const expected = Buffer.from(sign(payload));
    const actual = Buffer.from(signature);

    if (
      expected.length !== actual.length ||
      !timingSafeEqual(expected, actual)
    ) {
      return null;
    }

    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as AdminSession;

    if (
      session.email !== process.env.ADMIN_EMAIL ||
      typeof session.exp !== "number" ||
      session.exp <= Date.now()
    ) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  await connection();

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  return token ? verifyAdminToken(token) : null;
}
