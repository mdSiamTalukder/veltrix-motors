import { connection, NextResponse } from "next/server";
import { jsonError, requireAdmin } from "@/lib/api-helpers";
import {
  detectImageMime,
  deleteUploadedImage,
  saveUploadedImage,
  type StoredImage,
} from "@/lib/image-store";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_BYTES,
  MAX_VEHICLE_IMAGES,
  formatBytes,
} from "@/lib/validation";

const ALLOWED_LABEL = "JPEG, PNG, WebP, or GIF";

function isFileLike(value: unknown): value is File {
  return value instanceof Blob && typeof (value as File).name === "string";
}

export async function POST(request: Request) {
  await connection();

  const session = await requireAdmin();

  if (!session) {
    return jsonError("Unauthorized.", 401);
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    return jsonError("Upload must be sent as multipart/form-data.", 415);
  }

  let form: FormData;

  try {
    form = await request.formData();
  } catch {
    return jsonError("Unable to read the uploaded file.", 400);
  }

  const candidates = [...form.getAll("files"), ...form.getAll("file")].filter(
    isFileLike,
  );

  if (candidates.length === 0) {
    return jsonError("No image was provided.", 400, {
      file: "Select at least one image to upload.",
    });
  }

  if (candidates.length > MAX_VEHICLE_IMAGES) {
    return jsonError(
      `You can upload at most ${MAX_VEHICLE_IMAGES} images at once.`,
      400,
      { file: `Too many files selected.` },
    );
  }

  const prepared: { buffer: Buffer; mimeType: string }[] = [];

  for (const file of candidates) {
    if (file.size === 0) {
      return jsonError("One of the selected files is empty.", 400, {
        file: "Empty files cannot be uploaded.",
      });
    }

    if (file.size > MAX_IMAGE_BYTES) {
      return jsonError(
        `Each image must be ${formatBytes(MAX_IMAGE_BYTES)} or smaller.`,
        413,
        { file: "One of the selected files is too large." },
      );
    }

    let buffer: Buffer;

    try {
      buffer = Buffer.from(await file.arrayBuffer());
    } catch {
      return jsonError("Unable to read one of the uploaded files.", 400);
    }

    const mimeType = detectImageMime(buffer);

    if (!mimeType) {
      return jsonError(
        `Unsupported image format. Allowed formats: ${ALLOWED_LABEL}.`,
        415,
        { file: "One of the selected files is not a supported image." },
      );
    }

    prepared.push({ buffer, mimeType });
  }

  const saved: StoredImage[] = [];

  try {
    for (const item of prepared) {
      saved.push(await saveUploadedImage(item.buffer, item.mimeType));
    }
  } catch (error) {
    await Promise.all(saved.map((image) => deleteUploadedImage(image.url)));
    console.error("POST /api/admin/uploads failed:", error);
    return jsonError("Unable to store the uploaded image.", 500);
  }

  return NextResponse.json(
    {
      files: saved,
      allowedTypes: ALLOWED_IMAGE_MIME_TYPES,
      maxBytes: MAX_IMAGE_BYTES,
    },
    { status: 201 },
  );
}
