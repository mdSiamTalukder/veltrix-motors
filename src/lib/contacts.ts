import "server-only";

import { readCollection, updateCollection } from "@/lib/json-store";
import type { FieldErrors } from "@/lib/api-helpers";
import {
  isValidEmail,
  isValidPhone,
  sanitizeMultiline,
  sanitizeText,
} from "@/lib/validation";
import type { ContactSubmission } from "@/types";

const CONTACTS_FILE = "contacts.json";

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
  const submission: ContactSubmission = {
    id: `msg-${crypto.randomUUID()}`,
    name: value.name,
    email: value.email,
    phone: value.phone,
    subject: value.subject,
    message: value.message,
    status: "new",
    createdAt: new Date().toISOString(),
  };

  await updateCollection<ContactSubmission[]>(CONTACTS_FILE, [], (current) => [
    submission,
    ...(Array.isArray(current) ? current : []),
  ]);

  return submission;
}

export async function listContacts(): Promise<ContactSubmission[]> {
  const contacts = await readCollection<ContactSubmission[]>(CONTACTS_FILE, []);
  return (Array.isArray(contacts) ? contacts : []).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export async function deleteContact(id: string): Promise<boolean> {
  let removed = false;

  await updateCollection<ContactSubmission[]>(CONTACTS_FILE, [], (current) => {
    const list = Array.isArray(current) ? current : [];
    const next = list.filter((contact) => contact.id !== id);
    removed = next.length !== list.length;
    return next;
  });

  return removed;
}
