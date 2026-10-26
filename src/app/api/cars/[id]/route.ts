import { connection, NextResponse } from "next/server";
import { isValidId, jsonError } from "@/lib/api-helpers";
import { DataStoreError } from "@/lib/json-store";
import { getPublishedVehicleById } from "@/lib/vehicles";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await connection();

  const { id } = await params;

  if (!isValidId(id)) {
    return jsonError("Invalid vehicle identifier.", 400);
  }

  try {
    const vehicle = await getPublishedVehicleById(id);

    if (!vehicle) {
      return jsonError("Vehicle not found.", 404);
    }

    return NextResponse.json({ vehicle });
  } catch (error) {
    if (error instanceof DataStoreError) {
      return jsonError("Vehicle data is temporarily unavailable.", 503);
    }

    console.error(`GET /api/cars/${id} failed:`, error);
    return jsonError("Unable to load vehicle.", 500);
  }
}
