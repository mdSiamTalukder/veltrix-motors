"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Vehicle } from "@/types";
import { DEFAULT_VEHICLE_IMAGE } from "@/lib/validation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const formatPrice = (price: number) =>
  `৳ ${new Intl.NumberFormat("en-BD").format(price)}`;

type Facets = {
  brands: string[];
  categories: string[];
};

export default function CarsPage() {
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("All");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("featured");

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [total, setTotal] = useState(0);
  const [brands, setBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const timer = setTimeout(() => {
      const params = new URLSearchParams();

      if (search.trim()) params.set("search", search.trim());
      if (brand !== "All") params.set("brand", brand);
      if (category !== "All") params.set("category", category);
      if (sort) params.set("sort", sort);

      setLoading(true);

      fetch(`/api/cars?${params.toString()}`, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error("Request failed");
          }
          return response.json();
        })
        .then((data: { vehicles?: Vehicle[]; total?: number; facets?: Facets }) => {
          setVehicles(data.vehicles ?? []);
          setTotal(
            typeof data.total === "number"
              ? data.total
              : (data.vehicles?.length ?? 0),
          );
          setBrands(data.facets?.brands ?? []);
          setCategories(data.facets?.categories ?? []);
          setError("");
        })
        .catch((fetchError: Error) => {
          if (fetchError.name === "AbortError") return;
          setError("Unable to load vehicles right now. Please try again.");
          setVehicles([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        });
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [search, brand, category, sort]);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-base-100 text-base-content">
        <section className="border-b border-base-300 bg-base-200">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
            <Link
              href="/"
              className="text-sm font-semibold text-gray-500 transition-colors hover:text-gray-700"
            >
              ← Back to Home
            </Link>

            <p className="mt-8 text-xs font-bold tracking-[0.25em] text-gray-500">
              THE VELTRIX COLLECTION
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Find Your Next Car.
            </h1>

            <p className="mt-5 max-w-2xl leading-7 opacity-70">
              Explore our sample collection of sedans, SUVs, luxury vehicles,
              and sports cars.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 text-sm">
              <span className="badge badge-outline px-4 py-4">
                {loading ? "Loading vehicles…" : `${total} Vehicles`}
              </span>

              <span className="badge badge-outline px-4 py-4">
                Multiple Categories
              </span>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-4 rounded-2xl border border-base-300 bg-base-100 p-4 sm:p-5 md:grid-cols-2 lg:grid-cols-4">
            <input
              className="input input-bordered w-full"
              placeholder="Search cars or brands..."
              aria-label="Search cars"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <select
              className="select select-bordered w-full"
              aria-label="Filter by brand"
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
            >
              <option value="All">All Brands</option>
              {brands.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              className="select select-bordered w-full"
              aria-label="Filter by category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="All">All Categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              className="select select-bordered w-full"
              aria-label="Sort cars"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="featured">Featured First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="year-new">Newest Year</option>
            </select>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold sm:text-2xl">
              Available Collection
            </h2>

            <p className="text-sm opacity-60">
              {vehicles.length} vehicles found
            </p>
          </div>

          {loading && vehicles.length === 0 ? (
            <div className="mt-8 flex items-center gap-3 rounded-2xl border border-base-300 px-5 py-16 text-sm opacity-70">
              <span className="loading loading-spinner loading-md" />
              Loading vehicles…
            </div>
          ) : error ? (
            <div className="mt-8 rounded-2xl border border-dashed border-error/40 px-5 py-16 text-center">
              <h3 className="text-xl font-bold">Something went wrong</h3>

              <p className="mt-2 text-sm opacity-60">{error}</p>

              <button
                type="button"
                className="btn mt-5 rounded-full border-gray-500 bg-gray-500 text-white hover:border-gray-700 hover:bg-gray-700"
                onClick={() => {
                  setSearch("");
                  setBrand("All");
                  setCategory("All");
                  setSort("featured");
                }}
              >
                Reset Filters
              </button>
            </div>
          ) : vehicles.length > 0 ? (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {vehicles.map((car) => (
                <article
                  key={car.id}
                  className="card overflow-hidden border border-base-300 bg-base-100 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <figure className="aspect-[16/10] overflow-hidden bg-base-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={car.image}
                      alt={`${car.brand} ${car.model}`}
                      loading="lazy"
                      className="size-full object-cover transition duration-500 hover:scale-105"
                      onError={(event) => {
                        event.currentTarget.src = DEFAULT_VEHICLE_IMAGE;
                      }}
                    />
                  </figure>

                  <div className="card-body gap-4 p-5 sm:p-6">
                    <div>
                      <span className="badge border-0 bg-gray-500 text-xs text-white">
                        {car.category}
                      </span>

                      <p className="mt-3 text-xs font-semibold uppercase tracking-wider opacity-60">
                        {car.brand}
                      </p>

                      <h3 className="mt-2 text-xl font-bold">
                        {car.model}
                      </h3>

                      <p className="mt-2 text-2xl font-black text-gray-500">
                        {formatPrice(car.price)}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-y border-base-300 py-4 text-sm">
                      <div>
                        <p className="text-xs font-bold opacity-60">YEAR</p>
                        <p className="mt-1">{car.year}</p>
                      </div>

                      <div>
                        <p className="text-xs font-bold opacity-60">
                          MILEAGE
                        </p>
                        <p className="mt-1">
                          {new Intl.NumberFormat("en-BD").format(
                            car.mileage,
                          )}{" "}
                          km
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="badge badge-outline">
                        {car.transmission}
                      </span>

                      <span className="badge badge-outline">
                        {car.fuel}
                      </span>

                      <span className="badge badge-outline">
                        {car.condition}
                      </span>
                    </div>

                    <Link
                      href={`/cars/${car.id}`}
                      className="btn mt-1 rounded-xl border-gray-500 text-gray-500 transition-colors hover:bg-gray-500 hover:text-white"
                    >
                      Request Details ↗
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-dashed border-base-300 px-5 py-16 text-center">
              <h3 className="text-xl font-bold">No cars found</h3>

              <p className="mt-2 text-sm opacity-60">
                Try another search term or reset your filters.
              </p>

              <button
                type="button"
                className="btn mt-5 rounded-full border-gray-500 bg-gray-500 text-white hover:border-gray-700 hover:bg-gray-700"
                onClick={() => {
                  setSearch("");
                  setBrand("All");
                  setCategory("All");
                  setSort("featured");
                }}
              >
                Clear Filters
              </button>
            </div>
          )}

          <p className="mt-8 text-xs leading-6 opacity-50">
            Demo inventory only. Vehicle prices, specifications, availability,
            and images must be verified before real-world publication.
          </p>
        </section>
      </main>

      <Footer />
    </>
  );
}
