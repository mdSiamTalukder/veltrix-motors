import { NextResponse } from "next/server";
import {
  COOKIE_NAME,
  SESSION_DURATION,
  createAdminToken,
} from "@/lib/admin-auth";
import { getClientIp, jsonError, readJsonBody } from "@/lib/api-helpers";
import {
  clearLoginFailures,
  isLoginBlocked,
  recordLoginFailure,
} from "@/lib/login-rate-limit";
import { secureCompare } from "@/lib/secure-compare";

const LOGIN_BODY_LIMIT = 4 * 1024;

function readCredential(data: unknown, field: "email" | "password"): string {
  if (typeof data !== "object" || data === null) {
    return "";
  }

  const value = (data as Record<string, unknown>)[field];
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  const rateLimitKey = `admin-login:${getClientIp(request)}`;

  if (isLoginBlocked(rateLimitKey)) {
    return jsonError(
      "Too many login attempts. Please try again later.",
      429,
    );
  }

  const body = await readJsonBody(request, LOGIN_BODY_LIMIT);

  if (!body.ok) {
    return body.response;
  }

  const email = readCredential(body.data, "email");
  const password = readCredential(body.data, "password");

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error("Admin login error: admin credentials are not configured.");

    return jsonError("Unable to process login request.", 500);
  }

  const emailMatches = secureCompare(
    email.trim().toLowerCase(),
    adminEmail.toLowerCase(),
  );
  const passwordMatches = secureCompare(password, adminPassword);

  if (email === "" || password === "" || !emailMatches || !passwordMatches) {
    recordLoginFailure(rateLimitKey);

    return jsonError("Invalid email or password.", 401);
  }

  try {
    clearLoginFailures(rateLimitKey);

    const token = createAdminToken(adminEmail);

    const response = NextResponse.json({
      success: true,
      redirectTo: "/admin/dashboard",
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION / 1000,
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);

    return jsonError("Unable to process login request.", 500);
  }
}
