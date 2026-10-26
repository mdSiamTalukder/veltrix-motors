import "server-only";

import { sql } from "@/lib/db";
import { deleteUploadedImage, isManagedImageUrl } from "@/lib/image-store";
import { getVehicleImages } from "@/lib/vehicle-images";
import type { FieldErrors } from "@/lib/api-helpers";
import {
  DEFAULT_VEHICLE_IMAGE,
  MAX_VEHICLE_IMAGES,
  normalizeImageList,
  normalizeImageRef,
  sanitizeText,
} from "@/lib/validation";
import type { Vehicle, VehicleCondition, VehicleStatus } from "@/types";

export const VEHICLE_STATUSES: VehicleStatus[] = [
  "Available",
  "Reserved",
  "Sold",
];

export const VEHICLE_CONDITIONS: VehicleCondition[] = ["New", "Used"];

export type VehicleSort =
  | "featured"
  | "price-low"
  | "price-high"
  | "year-new"
  | "year-old";

export type VehicleQuery = {
  search?: string;
  brand?: string;
  model?: string;
  category?: string;
  fuel?: string;
  transmission?: string;
  status?: string;
  condition?: string;
  featured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  year?: number;
  sort?: VehicleSort;
  limit?: number;
};

export type VehicleInputResult =
  | { ok: true; value: Partial<Vehicle> }
  | { ok: false; errors: FieldErrors };

function currentMaxYear() {
  return new Date().getFullYear() + 1;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

type VehicleRow = {
  id: string;
  brand: string;
  model: string;
  category: string | null;
  year: number | string;
  price: number | string;
  mileage: number | string;
  transmission: string;
  fuel: string;
  condition: VehicleCondition;
  status: VehicleStatus;
  published: boolean;
  featured: boolean;
  image: string;
  images: string[] | null;
  created_at: string | Date;
  updated_at: string | Date;
};

function toVehicle(row: VehicleRow): Vehicle {
  return {
    id: row.id,
    brand: row.brand,
    model: row.model,
    category: row.category ?? "General",
    year: Number(row.year),
    price: Number(row.price),
    mileage: Number(row.mileage),
    transmission: row.transmission,
    fuel: row.fuel,
    condition: row.condition,
    status: row.status,
    published: row.published,
    featured: row.featured,
    image: row.image,
    images: row.images ?? [],
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : new Date(row.created_at).toISOString(),
    updatedAt:
      row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : new Date(row.updated_at).toISOString(),
  };
}

function isPublishedVehicle(vehicle: Vehicle) {
  return vehicle.published !== false;
}

export async function getAllVehicles(): Promise<Vehicle[]> {
  const rows = (await sql`
    SELECT
      id, brand, model, category, year, price, mileage,
      transmission, fuel, condition, status, published,
      featured, image, images, created_at, updated_at
    FROM vehicles
    ORDER BY created_at DESC
  `) as unknown as VehicleRow[];

  return rows.map(toVehicle);
}

export async function getVehicleById(id: string): Promise<Vehicle | null> {
  const vehicles = await getAllVehicles();
  return vehicles.find((vehicle) => vehicle.id === id) ?? null;
}

export async function getPublishedVehicleById(
  id: string,
): Promise<Vehicle | null> {
  const vehicle = await getVehicleById(id);
  return vehicle && isPublishedVehicle(vehicle) ? vehicle : null;
}

function matchesQuery(vehicle: Vehicle, query: VehicleQuery): boolean {
  if (query.search) {
    const haystack =
      `${vehicle.brand} ${vehicle.model} ${vehicle.category}`.toLowerCase();

    if (!haystack.includes(query.search.toLowerCase())) {
      return false;
    }
  }

  if (query.brand && vehicle.brand.toLowerCase() !== query.brand.toLowerCase()) {
    return false;
  }

  if (query.model && vehicle.model.toLowerCase() !== query.model.toLowerCase()) {
    return false;
  }

  if (
    query.category &&
    vehicle.category.toLowerCase() !== query.category.toLowerCase()
  ) {
    return false;
  }

  if (query.fuel && vehicle.fuel.toLowerCase() !== query.fuel.toLowerCase()) {
    return false;
  }

  if (
    query.transmission &&
    vehicle.transmission.toLowerCase() !== query.transmission.toLowerCase()
  ) {
    return false;
  }

  if (
    query.status &&
    vehicle.status.toLowerCase() !== query.status.toLowerCase()
  ) {
    return false;
  }

  if (
    query.condition &&
    vehicle.condition.toLowerCase() !== query.condition.toLowerCase()
  ) {
    return false;
  }

  if (typeof query.featured === "boolean" && vehicle.featured !== query.featured) {
    return false;
  }

  if (typeof query.minPrice === "number" && vehicle.price < query.minPrice) {
    return false;
  }

  if (typeof query.maxPrice === "number" && vehicle.price > query.maxPrice) {
    return false;
  }

  if (typeof query.minYear === "number" && vehicle.year < query.minYear) {
    return false;
  }

  if (typeof query.maxYear === "number" && vehicle.year > query.maxYear) {
    return false;
  }

  if (typeof query.year === "number" && vehicle.year !== query.year) {
    return false;
  }

  return true;
}

function sortVehicles(vehicles: Vehicle[], sort: VehicleSort): Vehicle[] {
  const sorted = [...vehicles];

  switch (sort) {
    case "price-low":
      return sorted.sort((a, b) => a.price - b.price);

    case "price-high":
      return sorted.sort((a, b) => b.price - a.price);

    case "year-new":
      return sorted.sort((a, b) => b.year - a.year);

    case "year-old":
      return sorted.sort((a, b) => a.year - b.year);

    case "featured":
    default:
      return sorted.sort((a, b) => {
        const featured = Number(b.featured) - Number(a.featured);

        if (featured !== 0) return featured;

        return b.year - a.year;
      });
  }
}

export async function queryVehicles(
  query: VehicleQuery,
  { publishedOnly }: { publishedOnly: boolean },
): Promise<{ vehicles: Vehicle[]; total: number }> {
  const all = await getAllVehicles();

  const filtered = all.filter(
    (vehicle) =>
      (!publishedOnly || isPublishedVehicle(vehicle)) &&
      matchesQuery(vehicle, query),
  );

  const sorted = sortVehicles(filtered, query.sort ?? "featured");

  const limited =
    typeof query.limit === "number" ? sorted.slice(0, query.limit) : sorted;

  return { vehicles: limited, total: filtered.length };
}

export type VehicleFacets = {
  brands: string[];
  categories: string[];
  fuelTypes: string[];
  transmissions: string[];
  statuses: string[];
};

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim() !== ""))].sort(
    (a, b) => a.localeCompare(b),
  );
}

export async function getPublishedVehicleFacets(): Promise<VehicleFacets> {
  const published = (await getAllVehicles()).filter(isPublishedVehicle);

  return {
    brands: uniqueSorted(published.map((vehicle) => vehicle.brand)),
    categories: uniqueSorted(published.map((vehicle) => vehicle.category)),
    fuelTypes: uniqueSorted(published.map((vehicle) => vehicle.fuel)),
    transmissions: uniqueSorted(published.map((vehicle) => vehicle.transmission)),
    statuses: uniqueSorted(published.map((vehicle) => vehicle.status)),
  };
}

export function parseVehicleInput(
  raw: unknown,
  { partial }: { partial: boolean },
): VehicleInputResult {
  if (!isRecord(raw)) {
    return { ok: false, errors: { body: "Invalid vehicle payload." } };
  }

  const errors: FieldErrors = {};
  const value: Partial<Vehicle> = {};

  const has = (key: string) => raw[key] !== undefined && raw[key] !== null;

  if (has("brand") || !partial) {
    const brand = sanitizeText(raw.brand, 60);

    if (brand === "") errors.brand = "Brand is required.";
    else value.brand = brand;
  }

  if (has("model") || !partial) {
    const model = sanitizeText(raw.model, 80);

    if (model === "") errors.model = "Model is required.";
    else value.model = model;
  }

  if (has("category")) {
    value.category = sanitizeText(raw.category, 60);
  }

  if (has("year") || !partial) {
    const year = Number(raw.year);

    if (
      !Number.isInteger(year) ||
      year < 1900 ||
      year > currentMaxYear()
    ) {
      errors.year = `Year must be between 1900 and ${currentMaxYear()}.`;
    } else {
      value.year = year;
    }
  }

  if (has("price") || !partial) {
    const price = Number(raw.price);

    if (!Number.isFinite(price) || price <= 0 || price > 1_000_000_000_000) {
      errors.price = "Price must be a positive number.";
    } else {
      value.price = price;
    }
  }

  if (has("mileage") || !partial) {
    const mileage = Number(raw.mileage);

    if (!Number.isFinite(mileage) || mileage < 0 || mileage > 10_000_000) {
      errors.mileage = "Mileage must be zero or a positive number.";
    } else {
      value.mileage = mileage;
    }
  }

  if (has("transmission") || !partial) {
    const transmission = sanitizeText(raw.transmission, 40);

    if (transmission === "") {
      errors.transmission = "Transmission is required.";
    } else {
      value.transmission = transmission;
    }
  }

  if (has("fuel") || !partial) {
    const fuel = sanitizeText(raw.fuel, 40);

    if (fuel === "") errors.fuel = "Fuel type is required.";
    else value.fuel = fuel;
  }

  if (has("condition")) {
    const condition = sanitizeText(raw.condition, 10);

    if (VEHICLE_CONDITIONS.includes(condition as VehicleCondition)) {
      value.condition = condition as VehicleCondition;
    } else if (condition !== "") {
      errors.condition = "Condition must be New or Used.";
    }
  }

  if (has("status")) {
    const status = sanitizeText(raw.status, 20);

    if (VEHICLE_STATUSES.includes(status as VehicleStatus)) {
      value.status = status as VehicleStatus;
    } else {
      errors.status = "Availability must be Available, Reserved, or Sold.";
    }
  }

  if (has("published")) {
    if (typeof raw.published !== "boolean") {
      errors.published = "Published must be a boolean.";
    } else {
      value.published = raw.published;
    }
  }

  if (has("featured")) {
    if (typeof raw.featured !== "boolean") {
      errors.featured = "Featured must be a boolean.";
    } else {
      value.featured = raw.featured;
    }
  }

  let images: string[] | undefined;

  if (has("images")) {
    const list = normalizeImageList(raw.images);

    if (list === null) {
      errors.images = "Images must be a list of valid image URLs.";
    } else {
      images = list;
    }
  }

  if (has("image")) {
    const single = normalizeImageRef(raw.image);

    if (single !== null) {
      images = [single, ...(images ?? []).filter((url) => url !== single)];
    } else if (String(raw.image).trim() !== "") {
      errors.image = "Image must be a valid URL or uploaded file path.";
    }
  }

  if (images !== undefined) {
    const normalized = images.slice(0, MAX_VEHICLE_IMAGES);

    value.images = normalized;
    value.image = normalized[0] ?? DEFAULT_VEHICLE_IMAGE;
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value };
}

export async function createVehicle(
  raw: unknown,
): Promise<{ ok: true; vehicle: Vehicle } | { ok: false; errors: FieldErrors }> {
  const parsed = parseVehicleInput(raw, { partial: false });

  if (!parsed.ok) {
    return parsed;
  }

  const now = new Date().toISOString();
  const images = parsed.value.images ?? [];

  const vehicle: Vehicle = {
    id: `car-${crypto.randomUUID()}`,
    brand: parsed.value.brand ?? "",
    model: parsed.value.model ?? "",
    category: parsed.value.category ?? "General",
    year: parsed.value.year ?? new Date().getFullYear(),
    price: parsed.value.price ?? 0,
    mileage: parsed.value.mileage ?? 0,
    transmission: parsed.value.transmission ?? "Automatic",
    fuel: parsed.value.fuel ?? "Petrol",
    condition: parsed.value.condition ?? "Used",
    status: parsed.value.status ?? "Available",
    published: parsed.value.published ?? true,
    featured: parsed.value.featured ?? false,
    image: parsed.value.image ?? images[0] ?? DEFAULT_VEHICLE_IMAGE,
    images,
    createdAt: now,
    updatedAt: now,
  };

  const rows = (await sql`
    INSERT INTO vehicles (
      id, brand, model, category, year, price, mileage,
      transmission, fuel, condition, status, published,
      featured, image, images, created_at, updated_at
    )
    VALUES (
      ${vehicle.id}, ${vehicle.brand}, ${vehicle.model}, ${vehicle.category},
      ${vehicle.year}, ${vehicle.price}, ${vehicle.mileage},
      ${vehicle.transmission}, ${vehicle.fuel}, ${vehicle.condition},
      ${vehicle.status}, ${vehicle.published}, ${vehicle.featured},
      ${vehicle.image}, ${JSON.stringify(vehicle.images)}::jsonb,
      ${vehicle.createdAt}, ${vehicle.updatedAt}
    )
    RETURNING
      id, brand, model, category, year, price, mileage,
      transmission, fuel, condition, status, published,
      featured, image, images, created_at, updated_at
  `) as unknown as VehicleRow[];

  if (!rows[0]) {
    throw new Error("Vehicle could not be created.");
  }

  return { ok: true, vehicle: toVehicle(rows[0]) };
}

export async function updateVehicle(
  id: string,
  raw: unknown,
): Promise<
  | { ok: true; vehicle: Vehicle }
  | { ok: false; errors: FieldErrors; notFound?: boolean }
> {
  const parsed = parseVehicleInput(raw, { partial: true });

  if (!parsed.ok) {
    return parsed;
  }

  const existing = await getVehicleById(id);

  if (!existing) {
    return { ok: false, errors: {}, notFound: true };
  }

  const updated: Vehicle = {
    ...existing,
    ...parsed.value,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };

  const rows = (await sql`
    UPDATE vehicles
    SET
      brand = ${updated.brand},
      model = ${updated.model},
      category = ${updated.category},
      year = ${updated.year},
      price = ${updated.price},
      mileage = ${updated.mileage},
      transmission = ${updated.transmission},
      fuel = ${updated.fuel},
      condition = ${updated.condition},
      status = ${updated.status},
      published = ${updated.published},
      featured = ${updated.featured},
      image = ${updated.image},
      images = ${JSON.stringify(updated.images ?? [])}::jsonb,
      updated_at = ${updated.updatedAt}
    WHERE id = ${id}
    RETURNING
      id, brand, model, category, year, price, mileage,
      transmission, fuel, condition, status, published,
      featured, image, images, created_at, updated_at
  `) as unknown as VehicleRow[];

  if (!rows[0]) {
    return { ok: false, errors: {}, notFound: true };
  }

  return { ok: true, vehicle: toVehicle(rows[0]) };
}

export async function deleteVehicle(id: string): Promise<boolean> {
  const rows = (await sql`
    DELETE FROM vehicles
    WHERE id = ${id}
    RETURNING id
  `) as unknown as { id: string }[];

  return rows.length > 0;
}

export async function getVehicleCounts() {
  const vehicles = await getAllVehicles();

  return {
    total: vehicles.length,
    published: vehicles.filter(isPublishedVehicle).length,
    available: vehicles.filter((vehicle) => vehicle.status === "Available")
      .length,
  };
}

export async function releaseVehicleImages(urls: string[]): Promise<void> {
  const managed = [...new Set(urls.filter(isManagedImageUrl))];

  if (managed.length === 0) {
    return;
  }

  const all = await getAllVehicles();
  const referenced = new Set(all.flatMap((vehicle) => getVehicleImages(vehicle)));

  const deletable = managed.filter((url) => !referenced.has(url));

  await Promise.all(deletable.map((url) => deleteUploadedImage(url)));
}