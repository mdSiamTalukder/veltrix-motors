import { connection } from "next/server";
import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-helpers";
import { DataStoreError } from "@/lib/json-store";
import { parseVehicleQuery } from "@/lib/vehicle-query";
import {
  getPublishedVehicleFacets,
  queryVehicles,
} from "@/lib/vehicles";

export async function GET(request: Request) {
  await connection();

  const { searchParams } = new URL(request.url);
  const parsed = parseVehicleQuery(searchParams);

  if (!parsed.ok) {
    return jsonError("Invalid query parameters.", 400, parsed.errors);
  }

  try {
    const { vehicles, total } = await queryVehicles(parsed.value, {
      publishedOnly: true,
    });

    const facets = await getPublishedVehicleFacets();

    return NextResponse.json({ vehicles, total, facets });
  } catch (error) {
    if (error instanceof DataStoreError) {
      return jsonError("Inventory data is temporarily unavailable.", 503);
    }

    console.error("GET /api/cars failed:", error);
    return jsonError("Unable to load vehicles.", 500);
  }
}
