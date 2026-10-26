import { NextResponse } from "next/server";
import {
  isValidId,
  jsonError,
  readJsonBody,
  requireAdmin,
} from "@/lib/api-helpers";
import {
  deleteInquiry,
  getInquiryById,
  setInquiryStatus,
} from "@/lib/inquiries";
import { DataStoreError } from "@/lib/json-store";
import type { InquiryStatus } from "@/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();

  if (!session) {
    return jsonError("Unauthorized.", 401);
  }

  const { id } = await params;

  if (!isValidId(id)) {
    return jsonError("Invalid inquiry identifier.", 400);
  }

  try {
    const inquiry = await getInquiryById(id);

    if (!inquiry) {
      return jsonError("Inquiry not found.", 404);
    }

    return NextResponse.json({ inquiry });
  } catch (error) {
    if (error instanceof DataStoreError) {
      return jsonError("Inquiries are temporarily unavailable.", 503);
    }

    console.error(`GET /api/inquiries/${id} failed:`, error);
    return jsonError("Unable to load inquiry.", 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();

  if (!session) {
    return jsonError("Unauthorized.", 401);
  }

  const { id } = await params;

  if (!isValidId(id)) {
    return jsonError("Invalid inquiry identifier.", 400);
  }

  const body = await readJsonBody(request, 4 * 1024);

  if (!body.ok) {
    return body.response;
  }

  const status =
    typeof body.data === "object" && body.data !== null
      ? (body.data as Record<string, unknown>).status
      : undefined;

  if (status !== "new" && status !== "read") {
    return jsonError("Status must be 'new' or 'read'.", 400, {
      status: "Invalid status.",
    });
  }

  try {
    const inquiry = await setInquiryStatus(id, status as InquiryStatus);

    if (!inquiry) {
      return jsonError("Inquiry not found.", 404);
    }

    return NextResponse.json({ inquiry });
  } catch (error) {
    if (error instanceof DataStoreError) {
      return jsonError("Inquiries are temporarily unavailable.", 503);
    }

    console.error(`PATCH /api/inquiries/${id} failed:`, error);
    return jsonError("Unable to update inquiry.", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();

  if (!session) {
    return jsonError("Unauthorized.", 401);
  }

  const { id } = await params;

  if (!isValidId(id)) {
    return jsonError("Invalid inquiry identifier.", 400);
  }

  try {
    const removed = await deleteInquiry(id);

    if (!removed) {
      return jsonError("Inquiry not found.", 404);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof DataStoreError) {
      return jsonError("Inquiries are temporarily unavailable.", 503);
    }

    console.error(`DELETE /api/inquiries/${id} failed:`, error);
    return jsonError("Unable to delete inquiry.", 500);
  }
}
