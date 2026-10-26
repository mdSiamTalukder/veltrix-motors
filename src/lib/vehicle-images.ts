import type { Vehicle } from "@/types";

export function getVehicleImages(
  vehicle: Pick<Vehicle, "image" | "images">,
): string[] {
  const list = [vehicle.image, ...(vehicle.images ?? [])].filter(
    (value): value is string =>
      typeof value === "string" && value.trim() !== "",
  );

  return [...new Set(list)];
}
