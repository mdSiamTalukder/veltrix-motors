
import "server-only";

import { sql } from "@/lib/db";
import type { FieldErrors } from "@/lib/api-helpers";
import {
  isValidEmail,
  isValidPhone,
  sanitizeMultiline,
  sanitizeText,
} from "@/lib/validation";
import type { Inquiry, InquiryStatus } from "@/types";

const INQUIRY_STATUSES: InquiryStatus[] = ["new", "read"];

type InquiryInput = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  vehicleId: string | null;
  vehicleName: string | null;
};

type InquiryParseResult =
  | { ok: true; value: InquiryInput }
  | { ok: false; errors: FieldErrors };

type InquiryRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  vehicle_id: string | null;
  vehicle_name: string | null;
  status: string;
  created_at: string | Date;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toInquiry(row: InquiryRow): Inquiry {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    message: row.message,
    vehicleId: row.vehicle_id,
    vehicleName: row.vehicle_name,
    status: row.status as InquiryStatus,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : new Date(row.created_at).toISOString(),
  };
}

export function parseInquiryInput(raw: unknown): InquiryParseResult {
  if (!isRecord(raw)) {
    return { ok: false, errors: { body: "Invalid inquiry payload." } };
  }

  const errors: FieldErrors = {};

  const name = sanitizeText(raw.name, 80);
  if (name.length < 2) errors.name = "Please enter your full name.";

  const email = sanitizeText(raw.email, 254).toLowerCase();
  if (!isValidEmail(email)) errors.email = "Please enter a valid email address.";

  const phone = sanitizeText(raw.phone, 25);
  if (!isValidPhone(phone)) errors.phone = "Please enter a valid phone number.";

  const subject = sanitizeText(raw.subject, 120) || "Vehicle inquiry";

  const message = sanitizeMultiline(raw.message, 2000);
  if (message.length < 5) errors.message = "Please enter a message.";

  let vehicleId: string | null = null;
  if (typeof raw.vehicleId === "string" && raw.vehicleId.trim() !== "") {
    const candidate = raw.vehicleId.trim();
    if (/^[A-Za-z0-9_-]{1,80}$/.test(candidate)) {
      vehicleId = candidate;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      name,
      email,
      phone,
      subject,
      message,
      vehicleId,
      vehicleName: null,
    },
  };
}

export async function createInquiry(value: InquiryInput): Promise<Inquiry> {
  const id = `inq-${crypto.randomUUID()}`;
  const createdAt = new Date();

  const rows = (await sql`
    INSERT INTO inquiries (
      id, name, email, phone, subject, message,
      vehicle_id, vehicle_name, status, created_at
    )
    VALUES (
      ${id},
      ${value.name},
      ${value.email},
      ${value.phone},
      ${value.subject},
      ${value.message},
      ${value.vehicleId},
      ${value.vehicleName},
      'new',
      ${createdAt.toISOString()}
    )
    RETURNING
      id, name, email, phone, subject, message,
      vehicle_id, vehicle_name, status, created_at
  `) as unknown as InquiryRow[];

  if (!rows[0]) {
    throw new Error("Failed to create inquiry.");
  }

  return toInquiry(rows[0]);
}

export async function listInquiries(options: {
  status?: string;
  search?: string;
}): Promise<Inquiry[]> {
  const rows = (await sql`
    SELECT
      id, name, email, phone, subject, message,
      vehicle_id, vehicle_name, status, created_at
    FROM inquiries
    ORDER BY created_at DESC
  `) as unknown as InquiryRow[];

  const inquiries = rows.map(toInquiry);
  const search = options.search?.trim().toLowerCase();

  return inquiries.filter((inquiry) => {
    if (
      options.status &&
      options.status !== "all" &&
      inquiry.status !== options.status
    ) {
      return false;
    }

    if (search) {
      const haystack =
        `${inquiry.name} ${inquiry.email} ${inquiry.subject} ${inquiry.message} ${inquiry.vehicleName ?? ""}`.toLowerCase();

      if (!haystack.includes(search)) return false;
    }

    return true;
  });
}

export async function getInquiryById(id: string): Promise<Inquiry | null> {
  const rows = (await sql`
    SELECT
      id, name, email, phone, subject, message,
      vehicle_id, vehicle_name, status, created_at
    FROM inquiries
    WHERE id = ${id}
    LIMIT 1
  `) as unknown as InquiryRow[];

  return rows[0] ? toInquiry(rows[0]) : null;
}

export async function setInquiryStatus(
  id: string,
  status: InquiryStatus,
): Promise<Inquiry | null> {
  if (!INQUIRY_STATUSES.includes(status)) {
    return null;
  }

  const rows = (await sql`
    UPDATE inquiries
    SET status = ${status}
    WHERE id = ${id}
    RETURNING
      id, name, email, phone, subject, message,
      vehicle_id, vehicle_name, status, created_at
  `) as unknown as InquiryRow[];

  return rows[0] ? toInquiry(rows[0]) : null;
}

export async function deleteInquiry(id: string): Promise<boolean> {
  const rows = (await sql`
    DELETE FROM inquiries
    WHERE id = ${id}
    RETURNING id
  `) as unknown as { id: string }[];

  return rows.length > 0;
}

export async function getInquiryCounts() {
  const rows = (await sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'new')::int AS new
    FROM inquiries
  `) as unknown as { total: number; new: number }[];

  return {
    total: Number(rows[0]?.total ?? 0),
    new: Number(rows[0]?.new ?? 0),
  };
}
