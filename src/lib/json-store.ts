import "server-only";

import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { getDataDir } from "@/lib/storage-paths";

const ALLOWED_FILES = new Set([
  "vehicles.json",
  "inquiries.json",
  "contacts.json",
]);

export class DataStoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DataStoreError";
  }
}

function resolveDataFile(fileName: string) {
  if (!ALLOWED_FILES.has(fileName)) {
    throw new DataStoreError("Unsupported data file requested.");
  }

  const dataDir = getDataDir();
  const resolved = path.resolve(dataDir, fileName);

  if (resolved !== path.join(dataDir, fileName)) {
    throw new DataStoreError("Invalid data file path.");
  }

  return resolved;
}

const locks = new Map<string, Promise<unknown>>();

function withFileLock<T>(key: string, task: () => Promise<T>): Promise<T> {
  const previous = locks.get(key) ?? Promise.resolve();
  const run = previous.then(task, task);

  locks.set(
    key,
    run.then(
      () => undefined,
      () => undefined,
    ),
  );

  return run;
}

async function ensureDataDir() {
  await mkdir(getDataDir(), { recursive: true });
}

async function readFileIfExists(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

function parseCollection<T>(raw: string | null, fileName: string, fallback: T): T {
  if (raw === null || raw.trim() === "") {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new DataStoreError(`Stored ${fileName} is not valid JSON.`);
  }
}

async function writeFileAtomic(filePath: string, data: unknown) {
  await ensureDataDir();

  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  const payload = `${JSON.stringify(data, null, 2)}\n`;

  try {
    await writeFile(tempPath, payload, "utf8");
    await rename(tempPath, filePath);
  } catch (error) {
    await unlink(tempPath).catch(() => undefined);
    throw error;
  }
}

export async function readCollection<T>(
  fileName: string,
  fallback: T,
): Promise<T> {
  const filePath = resolveDataFile(fileName);

  try {
    const raw = await readFileIfExists(filePath);
    return parseCollection(raw, fileName, fallback);
  } catch (error) {
    if (error instanceof DataStoreError) {
      throw error;
    }

    console.error(`Failed to read ${fileName}:`, error);
    throw new DataStoreError(`Unable to read ${fileName}.`);
  }
}

export async function writeCollection<T>(
  fileName: string,
  data: T,
): Promise<void> {
  const filePath = resolveDataFile(fileName);

  await withFileLock(filePath, async () => {
    try {
      await writeFileAtomic(filePath, data);
    } catch (error) {
      console.error(`Failed to write ${fileName}:`, error);
      throw new DataStoreError(`Unable to write ${fileName}.`);
    }
  });
}

export async function updateCollection<T>(
  fileName: string,
  fallback: T,
  mutate: (current: T) => T | Promise<T>,
): Promise<T> {
  const filePath = resolveDataFile(fileName);

  return withFileLock(filePath, async () => {
    let current: T;

    try {
      const raw = await readFileIfExists(filePath);
      current = parseCollection(raw, fileName, fallback);
    } catch (error) {
      if (error instanceof DataStoreError) {
        throw error;
      }

      console.error(`Failed to read ${fileName}:`, error);
      throw new DataStoreError(`Unable to read ${fileName}.`);
    }

    const next = await mutate(current);

    try {
      await writeFileAtomic(filePath, next);
    } catch (error) {
      console.error(`Failed to write ${fileName}:`, error);
      throw new DataStoreError(`Unable to write ${fileName}.`);
    }

    return next;
  });
}
