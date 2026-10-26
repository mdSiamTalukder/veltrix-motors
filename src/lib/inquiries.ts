import "server-only";

import { readCollection, updateCollection } from "@/lib/json-store";
import type { FieldErrors } from "@/lib/api-helpers";
import {
  isValidEmail,
  isValidPhone,
  sanitizeMultiline,
  sanitizeText,
} from "@/lib/validation";
import type { Inquiry, InquiryStatus } from "@/types";

const INQUIRIES_FILE = "inquiries.json";

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readInquiryCollection() {
  return readCollection<Inquiry[]>(INQUIRIES_FILE, []);
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

export async function createInquiry(
  value: InquiryInput,
): Promise<Inquiry> {
  const inquiry: Inquiry = {
    id: `inq-${crypto.randomUUID()}`,
    name: value.name,
    email: value.email,
    phone: value.phone,
    subject: value.subject,
    message: value.message,
    vehicleId: value.vehicleId,
    vehicleName: value.vehicleName,
    status: "new",
    createdAt: new Date().toISOString(),
  };

  await updateCollection<Inquiry[]>(INQUIRIES_FILE, [], (current) => [
    inquiry,
    ...(Array.isArray(current) ? current : []),
  ]);

  return inquiry;
}

export async function listInquiries(options: {
  status?: string;
  search?: string;
}): Promise<Inquiry[]> {
  const inquiries = await readInquiryCollection();
  const list = Array.isArray(inquiries) ? inquiries : [];

  const search = options.search?.trim().toLowerCase();

  return list
    .filter((inquiry) => {
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
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getInquiryById(id: string): Promise<Inquiry | null> {
  const inquiries = await readInquiryCollection();
  return (
    (Array.isArray(inquiries) ? inquiries : []).find(
      (inquiry) => inquiry.id === id,
    ) ?? null
  );
}

export async function setInquiryStatus(
  id: string,
  status: InquiryStatus,
): Promise<Inquiry | null> {
  if (!INQUIRY_STATUSES.includes(status)) {
    return null;
  }

  let updated: Inquiry | null = null;

  await updateCollection<Inquiry[]>(INQUIRIES_FILE, [], (current) =>
    (Array.isArray(current) ? current : []).map((inquiry) => {
      if (inquiry.id !== id) return inquiry;
      updated = { ...inquiry, status };
      return updated;
    }),
  );

  return updated;
}

export async function deleteInquiry(id: string): Promise<boolean> {
  let removed = false;

  await updateCollection<Inquiry[]>(INQUIRIES_FILE, [], (current) => {
    const list = Array.isArray(current) ? current : [];
    const next = list.filter((inquiry) => inquiry.id !== id);
    removed = next.length !== list.length;
    return next;
  });

  return removed;
}

export async function getInquiryCounts() {
  const inquiries = await readInquiryCollection();
  const list = Array.isArray(inquiries) ? inquiries : [];

  return {
    total: list.length,
    new: list.filter((inquiry) => inquiry.status === "new").length,
  };
}
