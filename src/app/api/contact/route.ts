import { NextResponse } from "next/server";
import {
  checkRateLimit,
  getClientIp,
  jsonError,
  readJsonBody,
  requireAdmin,
} from "@/lib/api-helpers";
import { createContact, listContacts, parseContactInput } from "@/lib/contacts";
import { DataStoreError } from "@/lib/json-store";

export async function POST(request: Request) {
  const ip = getClientIp(request);

  if (!checkRateLimit(`contact:${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 })) {
    return jsonError("Too many requests. Please try again later.", 429);
  }

  const body = await readJsonBody(request, 16 * 1024);

  if (!body.ok) {
    return body.response;
  }

  const record =
    typeof body.data === "object" && body.data !== null
      ? (body.data as Record<string, unknown>)
      : {};

  const honeypot = typeof record.company === "string" ? record.company : "";

  if (honeypot.trim() !== "") {
    return NextResponse.json(
      { message: "Thank you. Your message has been received." },
      { status: 201 },
    );
  }

  const parsed = parseContactInput(body.data);

  if (!parsed.ok) {
    return jsonError(
      "Please correct the highlighted fields.",
      400,
      parsed.errors,
    );
  }

  try {
    const submission = await createContact(parsed.value);

    return NextResponse.json(
      {
        message: "Thank you. Your message has been received.",
        submission: { id: submission.id, createdAt: submission.createdAt },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof DataStoreError) {
      return jsonError("Messages are temporarily unavailable.", 503);
    }

    console.error("POST /api/contact failed:", error);
    return jsonError("Unable to submit your message.", 500);
  }
}

export async function GET() {
  const session = await requireAdmin();

  if (!session) {
    return jsonError("Unauthorized.", 401);
  }

  try {
    const contacts = await listContacts();
    return NextResponse.json({ contacts, total: contacts.length });
  } catch (error) {
    if (error instanceof DataStoreError) {
      return jsonError("Messages are temporarily unavailable.", 503);
    }

    console.error("GET /api/contact failed:", error);
    return jsonError("Unable to load messages.", 500);
  }
}
