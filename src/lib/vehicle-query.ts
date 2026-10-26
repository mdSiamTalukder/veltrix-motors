import "server-only";

import type { FieldErrors } from "@/lib/api-helpers";
import {
  parseBooleanParam,
  parseIntegerParam,
  parseNumberParam,
  sanitizeText,
} from "@/lib/validation";
import type { VehicleQuery, VehicleSort } from "@/lib/vehicles";

const SORT_VALUES: VehicleSort[] = [
  "featured",
  "price-low",
  "price-high",
  "year-new",
  "year-old",
];

const MIN_YEAR = 1900;

function maxYear() {
  return new Date().getFullYear() + 1;
}

export function parseVehicleQuery(
  params: URLSearchParams,
): { ok: true; value: VehicleQuery } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const value: VehicleQuery = {};

  const readText = (keys: string[], max: number): string | undefined => {
    for (const key of keys) {
      if (params.has(key)) {
        const cleaned = sanitizeText(params.get(key), max);
        return cleaned === "" ? undefined : cleaned;
      }
    }
    return undefined;
  };

  const search = readText(["search", "q"], 80);
  if (search) value.search = search;

  const brand = readText(["brand"], 60);
  if (brand) value.brand = brand;

  const model = readText(["model"], 80);
  if (model) value.model = model;

  const category = readText(["category"], 60);
  if (category) value.category = category;

  const fuel = readText(["fuel"], 40);
  if (fuel) value.fuel = fuel;

  const transmission = readText(["transmission"], 40);
  if (transmission) value.transmission = transmission;

  const status = readText(["status", "availability"], 20);
  if (status) value.status = status;

  const condition = readText(["condition"], 10);
  if (condition) value.condition = condition;

  if (params.has("featured")) {
    const result = parseBooleanParam(params.get("featured"));
    if (result.ok) value.featured = result.value;
    else errors.featured = "featured must be a boolean.";
  }

  if (params.has("minPrice")) {
    const result = parseNumberParam(params.get("minPrice"), {
      min: 0,
      max: 1_000_000_000_000,
    });
    if (result.ok) value.minPrice = result.value;
    else errors.minPrice = "minPrice must be a positive number.";
  }

  if (params.has("maxPrice")) {
    const result = parseNumberParam(params.get("maxPrice"), {
      min: 0,
      max: 1_000_000_000_000,
    });
    if (result.ok) value.maxPrice = result.value;
    else errors.maxPrice = "maxPrice must be a positive number.";
  }

  if (params.has("minYear")) {
    const result = parseIntegerParam(params.get("minYear"), {
      min: MIN_YEAR,
      max: maxYear(),
    });
    if (result.ok) value.minYear = result.value;
    else errors.minYear = `minYear must be between ${MIN_YEAR} and ${maxYear()}.`;
  }

  if (params.has("maxYear")) {
    const result = parseIntegerParam(params.get("maxYear"), {
      min: MIN_YEAR,
      max: maxYear(),
    });
    if (result.ok) value.maxYear = result.value;
    else errors.maxYear = `maxYear must be between ${MIN_YEAR} and ${maxYear()}.`;
  }

  if (params.has("year")) {
    const result = parseIntegerParam(params.get("year"), {
      min: MIN_YEAR,
      max: maxYear(),
    });
    if (result.ok) value.year = result.value;
    else errors.year = `year must be between ${MIN_YEAR} and ${maxYear()}.`;
  }

  if (params.has("sort")) {
    const sort = sanitizeText(params.get("sort"), 20) as VehicleSort;
    if (SORT_VALUES.includes(sort)) value.sort = sort;
    else errors.sort = `sort must be one of: ${SORT_VALUES.join(", ")}.`;
  }

  if (params.has("limit")) {
    const result = parseIntegerParam(params.get("limit"), { min: 1, max: 100 });
    if (result.ok) value.limit = result.value;
    else errors.limit = "limit must be between 1 and 100.";
  }

  if (
    value.minPrice !== undefined &&
    value.maxPrice !== undefined &&
    value.minPrice > value.maxPrice
  ) {
    errors.maxPrice = "maxPrice must be greater than or equal to minPrice.";
  }

  if (
    value.minYear !== undefined &&
    value.maxYear !== undefined &&
    value.minYear > value.maxYear
  ) {
    errors.maxYear = "maxYear must be greater than or equal to minYear.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value };
}
