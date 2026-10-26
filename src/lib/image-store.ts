import "server-only";

import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  PUBLIC_UPLOAD_PREFIX,
} from "@/lib/validation";
import { getUploadDir } from "@/lib/storage-paths";

const MIME_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const FILENAME_PATTERN = /^[A-Za-z0-9_-]{1,120}\.(jpg|png|webp|gif)$/;

export type StoredImage = {
  url: string;
  filename: string;
  size: number;
  type: string;
};

function isAllowedMime(type: string): boolean {
  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(type);
}

function detectPng(buffer: Buffer): boolean {
  return (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  );
}

function detectJpeg(buffer: Buffer): boolean {
  return (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  );
}

function detectGif(buffer: Buffer): boolean {
  if (buffer.length < 6) return false;

  const header = buffer.subarray(0, 6).toString("ascii");
  return header === "GIF87a" || header === "GIF89a";
}

function detectWebp(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;

  return (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  );
}

export function detectImageMime(buffer: Buffer): string | null {
  if (detectPng(buffer)) return "image/png";
  if (detectJpeg(buffer)) return "image/jpeg";
  if (detectGif(buffer)) return "image/gif";
  if (detectWebp(buffer)) return "image/webp";
  return null;
}

export function isManagedImageUrl(url: string): boolean {
  return url.startsWith(PUBLIC_UPLOAD_PREFIX);
}

export function imageUrlToFilename(url: string): string | null {
  if (!isManagedImageUrl(url)) {
    return null;
  }

  const filename = url.slice(PUBLIC_UPLOAD_PREFIX.length);

  if (filename.includes("/") || filename.includes("\\")) {
    return null;
  }

  if (!FILENAME_PATTERN.test(filename)) {
    return null;
  }

  return filename;
}

function filenameToPath(filename: string): string | null {
  if (!FILENAME_PATTERN.test(filename)) {
    return null;
  }

  const uploadDir = getUploadDir();
  const resolved = path.resolve(uploadDir, filename);

  if (resolved !== path.join(uploadDir, filename)) {
    return null;
  }

  return resolved;
}

export async function saveUploadedImage(
  buffer: Buffer,
  mimeType: string,
): Promise<StoredImage> {
  if (!isAllowedMime(mimeType)) {
    throw new Error("Unsupported image type.");
  }

  const extension = MIME_EXTENSION[mimeType];

  if (!extension) {
    throw new Error("Unsupported image type.");
  }

  const uploadDir = getUploadDir();
  await mkdir(uploadDir, { recursive: true });

  const filename = `${crypto.randomUUID()}.${extension}`;
  const filePath = path.join(/*turbopackIgnore: true*/ uploadDir, filename);

  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;

  try {
    await writeFile(tempPath, buffer);
    await rename(tempPath, filePath);
  } catch (error) {
    await unlink(tempPath).catch(() => undefined);
    throw error;
  }

  return {
    url: `${PUBLIC_UPLOAD_PREFIX}${filename}`,
    filename,
    size: buffer.length,
    type: mimeType,
  };
}

export async function readUploadedImage(
  filename: string,
): Promise<{ buffer: Buffer; type: string } | null> {
  const filePath = filenameToPath(filename);

  if (filePath === null) {
    return null;
  }

  try {
    const buffer = await readFile(/*turbopackIgnore: true*/ filePath);
    const type = detectImageMime(buffer);

    if (!type) {
      return null;
    }

    return { buffer, type };
  } catch {
    return null;
  }
}

export async function deleteUploadedImage(url: string): Promise<boolean> {
  const filename = imageUrlToFilename(url);

  if (filename === null) {
    return false;
  }

  const filePath = filenameToPath(filename);

  if (filePath === null) {
    return false;
  }

  try {
    await unlink(filePath);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }

    console.error(`Failed to delete uploaded image ${filename}:`, error);
    return false;
  }
}
