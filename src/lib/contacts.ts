
import "server-only";

import { sql } from "@/lib/db";
import type { FieldErrors } from "@/lib/api-helpers";
import {
  isValidEmail,
  isValidPhone,
  sanitizeMultiline,
  sanitizeText,
} from "@/lib/validation";
import type { ContactSubmission } from "@/types";

type ContactInput = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

type ContactParseResult =
  | { ok: true; value: ContactInput }
  | { ok: false; errors: FieldErrors };

type ContactRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: string;
  created_at: string | Date;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toContactSubmission(row: ContactRow): ContactSubmission {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    message: row.message,
    status: row.status as ContactSubmission["status"],
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : new Date(row.created_at).toISOString(),
  };
}

export function parseContactInput(raw: unknown): ContactParseResult {
  if (!isRecord(raw)) {
    return { ok: false, errors: { body: "Invalid contact payload." } };
  }

  const errors: FieldErrors = {};

  const name = sanitizeText(raw.name, 80);
  if (name.length < 2) errors.name = "Please enter your full name.";

  const email = sanitizeText(raw.email, 254).toLowerCase();
  if (!isValidEmail(email)) errors.email = "Please enter a valid email address.";

  const phone = sanitizeText(raw.phone, 25);
  if (!isValidPhone(phone)) errors.phone = "Please enter a valid phone number.";

  const subject = sanitizeText(raw.subject, 120) || "General inquiry";

  const message = sanitizeMultiline(raw.message, 2000);
  if (message.length < 5) errors.message = "Please enter a message.";

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: { name, email, phone, subject, message } };
}

export async function createContact(
  value: ContactInput,
): Promise<ContactSubmission> {
  const id = `msg-${crypto.randomUUID()}`;
  const createdAt = new Date();

  const rows = (await sql`
    INSERT INTO contacts (
      id, name, email, phone, subject, message, status, created_at
    )
    VALUES (
      ${id},
      ${value.name},
      ${value.email},
      ${value.phone},
      ${value.subject},
      ${value.message},
      'new',
      ${createdAt.toISOString()}
    )
    RETURNING id, name, email, phone, subject, message, status, created_at
  `) as unknown as ContactRow[];

  if (!rows[0]) {
    throw new Error("Failed to create contact submission.");
  }

  return toContactSubmission(rows[0]);
}

export async function listContacts(): Promise<ContactSubmission[]> {
  const rows = (await sql`
    SELECT id, name, email, phone, subject, message, status, created_at
    FROM contacts
    ORDER BY created_at DESC
  `) as unknown as ContactRow[];

  return rows.map(toContactSubmission);
}

export async function deleteContact(id: string): Promise<boolean> {
  const rows = (await sql`
    DELETE FROM contacts
    WHERE id = ${id}
    RETURNING id
  `) as unknown as { id: string }[];

  return rows.length > 0;
}
