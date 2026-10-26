export const DEFAULT_VEHICLE_IMAGE =
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80";

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const MAX_VEHICLE_IMAGES = 8;

export const PUBLIC_UPLOAD_PREFIX = "/uploads/";

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function sanitizeText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") {
    return "";
  }

  const cleaned = value.replace(CONTROL_CHARACTERS, "").trim();

  if (cleaned.length > maxLength) {
    return cleaned.slice(0, maxLength).trim();
  }

  return cleaned;
}

export function sanitizeMultiline(value: unknown, maxLength: number): string {
  if (typeof value !== "string") {
    return "";
  }

  const cleaned = value.replace(CONTROL_CHARACTERS, "").trim();

  if (cleaned.length > maxLength) {
    return cleaned.slice(0, maxLength).trim();
  }

  return cleaned;
}

export function isValidEmail(value: string): boolean {
  if (value.length < 3 || value.length > 254) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidPhone(value: string): boolean {
  if (value.length === 0) {
    return true;
  }

  if (value.length > 25) {
    return false;
  }

  return /^[0-9+()\-\s.]+$/.test(value) && /\d/.test(value);
}

export function isHttpUrl(value: string): boolean {
  if (value.startsWith("/") && !value.startsWith("//")) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeImageRef(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed === "" || !isHttpUrl(trimmed)) {
    return null;
  }

  return trimmed;
}

export function normalizeImageList(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const result: string[] = [];

  for (const item of value) {
    const ref = normalizeImageRef(item);

    if (ref === null) {
      return null;
    }

    if (!result.includes(ref)) {
      result.push(ref);
    }
  }

  return result;
}

export function normalizeImageUrl(value: unknown): string {
  return normalizeImageRef(value) ?? DEFAULT_VEHICLE_IMAGE;
}

export function parseIntegerParam(
  value: string | null,
  { min, max }: { min: number; max: number },
): ValidationResult<number> {
  if (value === null || value.trim() === "") {
    return { ok: false, error: "missing" };
  }

  if (!/^-?\d+$/.test(value.trim())) {
    return { ok: false, error: "not-an-integer" };
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return { ok: false, error: "out-of-range" };
  }

  return { ok: true, value: parsed };
}

export function parseNumberParam(
  value: string | null,
  { min, max }: { min: number; max: number },
): ValidationResult<number> {
  if (value === null || value.trim() === "") {
    return { ok: false, error: "missing" };
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    return { ok: false, error: "out-of-range" };
  }

  return { ok: true, value: parsed };
}

export function parseBooleanParam(
  value: string | null,
): ValidationResult<boolean> {
  if (value === null || value.trim() === "") {
    return { ok: false, error: "missing" };
  }

  const normalized = value.trim().toLowerCase();

  if (["true", "1", "yes"].includes(normalized)) {
    return { ok: true, value: true };
  }

  if (["false", "0", "no"].includes(normalized)) {
    return { ok: true, value: false };
  }

  return { ok: false, error: "not-a-boolean" };
}
