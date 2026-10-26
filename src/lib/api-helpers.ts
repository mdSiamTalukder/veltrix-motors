import "server-only";

import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";

export type FieldErrors = Record<string, string>;

export function jsonError(
  message: string,
  status = 400,
  fields?: FieldErrors,
): NextResponse {
  return NextResponse.json(
    fields && Object.keys(fields).length > 0 ? { message, fields } : { message },
    { status },
  );
}

export async function requireAdmin() {
  return getAdminSession();
}

export const DEFAULT_MAX_BODY_BYTES = 16 * 1024;

type BodyResult =
  | { ok: true; data: unknown }
  | { ok: false; response: NextResponse };

export async function readJsonBody(
  request: Request,
  maxBytes = DEFAULT_MAX_BODY_BYTES,
): Promise<BodyResult> {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
    return {
      ok: false,
      response: jsonError("Request body must be JSON.", 415),
    };
  }

  const contentLength = request.headers.get("content-length");

  if (contentLength && Number(contentLength) > maxBytes) {
    return {
      ok: false,
      response: jsonError("Request body is too large.", 413),
    };
  }

  let text: string;

  try {
    text = await request.text();
  } catch {
    return {
      ok: false,
      response: jsonError("Unable to read request body.", 400),
    };
  }

  if (Buffer.byteLength(text, "utf8") > maxBytes) {
    return {
      ok: false,
      response: jsonError("Request body is too large.", 413),
    };
  }

  if (text.trim() === "") {
    return {
      ok: false,
      response: jsonError("Request body is required.", 400),
    };
  }

  try {
    return { ok: true, data: JSON.parse(text) as unknown };
  } catch {
    return {
      ok: false,
      response: jsonError("Request body is not valid JSON.", 400),
    };
  }
}

type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

const rateLimitBuckets = new Map<string, number[]>();

export function checkRateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions,
): boolean {
  const now = Date.now();
  const recent = (rateLimitBuckets.get(key) ?? []).filter(
    (timestamp) => now - timestamp < windowMs,
  );

  if (recent.length >= limit) {
    rateLimitBuckets.set(key, recent);
    return false;
  }

  recent.push(now);
  rateLimitBuckets.set(key, recent);

  return true;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function isValidId(id: string): boolean {
  return /^[A-Za-z0-9_-]{1,80}$/.test(id);
}

export function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}
