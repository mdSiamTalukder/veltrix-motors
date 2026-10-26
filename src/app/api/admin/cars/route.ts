import { NextResponse } from "next/server";
import {
  jsonError,
  readJsonBody,
  requireAdmin,
} from "@/lib/api-helpers";
import { DataStoreError } from "@/lib/json-store";
import { parseVehicleQuery } from "@/lib/vehicle-query";
import { createVehicle, queryVehicles } from "@/lib/vehicles";

export async function GET(request: Request) {
  const session = await requireAdmin();

  if (!session) {
    return jsonError("Unauthorized.", 401);
  }

  const { searchParams } = new URL(request.url);
  const parsed = parseVehicleQuery(searchParams);

  if (!parsed.ok) {
    return jsonError("Invalid query parameters.", 400, parsed.errors);
  }

  try {
    const { vehicles, total } = await queryVehicles(parsed.value, {
      publishedOnly: false,
    });

    return NextResponse.json({ vehicles, total });
  } catch (error) {
    if (error instanceof DataStoreError) {
      return jsonError("Inventory data is temporarily unavailable.", 503);
    }

    console.error("GET /api/admin/cars failed:", error);
    return jsonError("Unable to load vehicles.", 500);
  }
}

export async function POST(request: Request) {
  const session = await requireAdmin();

  if (!session) {
    return jsonError("Unauthorized.", 401);
  }

  const body = await readJsonBody(request, 16 * 1024);

  if (!body.ok) {
    return body.response;
  }

  try {
    const result = await createVehicle(body.data);

    if (!result.ok) {
      return jsonError("Please correct the highlighted fields.", 400, result.errors);
    }

    return NextResponse.json({ vehicle: result.vehicle }, { status: 201 });
  } catch (error) {
    if (error instanceof DataStoreError) {
      return jsonError("Inventory data is temporarily unavailable.", 503);
    }

    console.error("POST /api/admin/cars failed:", error);
    return jsonError("Unable to create vehicle.", 500);
  }
}
