import "server-only";

import { mkdir } from "node:fs/promises";
import path from "node:path";

function resolveStorageDir(
  configuredPath: string | undefined,
  fallbackName: string,
): string {
  const value = configuredPath?.trim();

  if (!value) {
    return path.join(/*turbopackIgnore: true*/ process.cwd(), fallbackName);
  }

  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), value);
}

export function getDataDir(): string {
  return resolveStorageDir(process.env.VELTRIX_DATA_DIR, "data");
}

export function getUploadDir(): string {
  return resolveStorageDir(process.env.VELTRIX_UPLOAD_DIR, "uploads");
}

export async function ensureStorageDirs(): Promise<void> {
  await Promise.all([
    mkdir(getDataDir(), { recursive: true }),
    mkdir(getUploadDir(), { recursive: true }),
  ]);
}
