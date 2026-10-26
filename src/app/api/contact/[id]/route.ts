import { NextResponse } from "next/server";
import { isValidId, jsonError, requireAdmin } from "@/lib/api-helpers";
import { deleteContact } from "@/lib/contacts";
import { DataStoreError } from "@/lib/json-store";

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
    return jsonError("Invalid contact message identifier.", 400);
  }

  try {
    const removed = await deleteContact(id);

    if (!removed) {
      return jsonError("Contact message not found.", 404);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof DataStoreError) {
      return jsonError("Messages are temporarily unavailable.", 503);
    }

    console.error(`DELETE /api/contact/${id} failed:`, error);
    return jsonError("Unable to delete contact message.", 500);
  }
}
