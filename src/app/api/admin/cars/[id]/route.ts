import { NextResponse } from "next/server";
import {
  isValidId,
  jsonError,
  readJsonBody,
  requireAdmin,
} from "@/lib/api-helpers";
import { DataStoreError } from "@/lib/json-store";
import { getVehicleImages } from "@/lib/vehicle-images";
import {
  deleteVehicle,
  getVehicleById,
  releaseVehicleImages,
  updateVehicle,
} from "@/lib/vehicles";

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
    return jsonError("Invalid vehicle identifier.", 400);
  }

  try {
    const vehicle = await getVehicleById(id);

    if (!vehicle) {
      return jsonError("Vehicle not found.", 404);
    }

    return NextResponse.json({ vehicle });
  } catch (error) {
    if (error instanceof DataStoreError) {
      return jsonError("Inventory data is temporarily unavailable.", 503);
    }

    console.error(`GET /api/admin/cars/${id} failed:`, error);
    return jsonError("Unable to load vehicle.", 500);
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
    return jsonError("Invalid vehicle identifier.", 400);
  }

  const body = await readJsonBody(request, 16 * 1024);

  if (!body.ok) {
    return body.response;
  }

  try {
    const previous = await getVehicleById(id);
    const result = await updateVehicle(id, body.data);

    if (!result.ok) {
      if (result.notFound) {
        return jsonError("Vehicle not found.", 404);
      }

      return jsonError("Please correct the highlighted fields.", 400, result.errors);
    }

    if (previous) {
      const nextImages = new Set(getVehicleImages(result.vehicle));
      const removed = getVehicleImages(previous).filter(
        (url) => !nextImages.has(url),
      );

      if (removed.length > 0) {
        await releaseVehicleImages(removed);
      }
    }

    return NextResponse.json({ vehicle: result.vehicle });
  } catch (error) {
    if (error instanceof DataStoreError) {
      return jsonError("Inventory data is temporarily unavailable.", 503);
    }

    console.error(`PATCH /api/admin/cars/${id} failed:`, error);
    return jsonError("Unable to update vehicle.", 500);
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
    return jsonError("Invalid vehicle identifier.", 400);
  }

  try {
    const previous = await getVehicleById(id);
    const removed = await deleteVehicle(id);

    if (!removed) {
      return jsonError("Vehicle not found.", 404);
    }

    if (previous) {
      await releaseVehicleImages(getVehicleImages(previous));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof DataStoreError) {
      return jsonError("Inventory data is temporarily unavailable.", 503);
    }

    console.error(`DELETE /api/admin/cars/${id} failed:`, error);
    return jsonError("Unable to delete vehicle.", 500);
  }
}
