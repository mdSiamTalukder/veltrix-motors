"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Vehicle, VehicleCondition, VehicleStatus } from "@/types";
import { getVehicleImages } from "@/lib/vehicle-images";
import { DEFAULT_VEHICLE_IMAGE } from "@/lib/validation";
import CarPhotoUploader, {
  type CarImageDraft,
} from "@/components/admin/CarPhotoUploader";
import {
  ArrowLeft,
  CarFront,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Fuel,
  Gauge,
  Pencil,
  Plus,
  Search,
  Settings2,
  Trash2,
  X,
} from "lucide-react";

type CarItem = Vehicle;

type CarStatus = VehicleStatus;

type CarCondition = VehicleCondition;

const emptyForm = {
  brand: "",
  model: "",
  category: "",
  year: String(new Date().getFullYear()),
  price: "",
  mileage: "",
  fuel: "Petrol",
  transmission: "Automatic",
  condition: "Used" as CarCondition,
  status: "Available" as CarStatus,
  featured: false,
  published: true,
};

const money = (amount: number) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace("BDT", "৳");

function releasePreviews(images: CarImageDraft[]) {
  images.forEach((image) => {
    if (image.kind === "new") {
      URL.revokeObjectURL(image.preview);
    }
  });
}

export default function ManageCarsPage() {
  const [cars, setCars] = useState<CarItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [publicationFilter, setPublicationFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("newest");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState<CarImageDraft[]>([]);
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const imagesRef = useRef(images);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  const loadCars = useCallback(async (signal?: AbortSignal) => {
    const response = await fetch("/api/admin/cars", signal ? { signal } : {});

    if (response.status === 401) {
      throw new Error("unauthorized");
    }

    if (!response.ok) {
      throw new Error("Request failed");
    }

    const data = (await response.json()) as { vehicles?: CarItem[] };

    setCars(data.vehicles ?? []);
    setLoadError("");
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void Promise.resolve()
      .then(() => loadCars(controller.signal))
      .catch((error: Error) => {
        if (error.name === "AbortError") return;
        setLoadError("Unable to load inventory. Please refresh the page.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [loadCars]);

  useEffect(() => {
    if (!successMessage) return;

    const timer = setTimeout(() => setSuccessMessage(""), 5000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const filteredCars = useMemo(() => {
    const query = search.trim().toLowerCase();

    return cars
      .filter((car) => {
        const matchesSearch =
          `${car.brand} ${car.model} ${car.year}`.toLowerCase().includes(query);

        const matchesStatus =
          statusFilter === "All" || car.status === statusFilter;

        const matchesPublication =
          publicationFilter === "All" ||
          (publicationFilter === "Published" && car.published) ||
          (publicationFilter === "Unpublished" && !car.published);

        return matchesSearch && matchesStatus && matchesPublication;
      })
      .sort((a, b) => {
        if (sortOrder === "price-low") return a.price - b.price;
        if (sortOrder === "price-high") return b.price - a.price;
        return b.year - a.year;
      });
  }, [cars, search, statusFilter, publicationFilter, sortOrder]);

  const availableCount = cars.filter(
    (car) => car.status === "Available",
  ).length;

  const publishedCount = cars.filter((car) => car.published).length;

  function resetForm() {
    releasePreviews(imagesRef.current);
    setForm({ ...emptyForm });
    setImages([]);
    setEditingId(null);
    setFormError("");
  }

  function openAddModal() {
    resetForm();
    setModalOpen(true);
  }

  function openEditModal(car: CarItem) {
    releasePreviews(imagesRef.current);
    setEditingId(car.id);
    setForm({
      brand: car.brand,
      model: car.model,
      category: car.category ?? "",
      year: String(car.year),
      price: String(car.price),
      mileage: String(car.mileage),
      fuel: car.fuel,
      transmission: car.transmission,
      condition: car.condition,
      status: car.status,
      featured: car.featured,
      published: car.published,
    });
    setImages(
      getVehicleImages(car).map((url) => ({
        id: crypto.randomUUID(),
        kind: "existing",
        url,
      })),
    );
    setFormError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (isSaving) return;
    releasePreviews(imagesRef.current);
    setImages([]);
    setModalOpen(false);
    setEditingId(null);
    setFormError("");
  }

  async function uploadPhoto(file: File): Promise<string> {
    const body = new FormData();
    body.append("file", file);

    const response = await fetch("/api/admin/uploads", {
      method: "POST",
      body,
    });

    const data = (await response.json().catch(() => null)) as {
      files?: { url?: string }[];
      message?: string;
    } | null;

    const url = data?.files?.[0]?.url;

    if (!response.ok || !url) {
      throw new Error(data?.message ?? "Unable to upload one of the images.");
    }

    return url;
  }

  async function saveCar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSaving) return;

    const year = Number(form.year);
    const price = Number(form.price);
    const mileage = Number(form.mileage);

    if (
      !form.brand.trim() ||
      !form.model.trim() ||
      !Number.isInteger(year) ||
      year < 1900 ||
      year > new Date().getFullYear() + 1 ||
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isFinite(mileage) ||
      mileage < 0
    ) {
      setFormError("Please enter valid vehicle details and price.");
      return;
    }

    setIsSaving(true);
    setFormError("");
    setActionError("");

    try {
      const finalImages: string[] = [];

      for (const image of imagesRef.current) {
        if (image.kind === "existing") {
          finalImages.push(image.url);
        } else {
          finalImages.push(await uploadPhoto(image.file));
        }
      }

      const payload = {
        brand: form.brand.trim(),
        model: form.model.trim(),
        category: form.category.trim(),
        year,
        price,
        mileage,
        fuel: form.fuel,
        transmission: form.transmission,
        condition: form.condition,
        status: form.status,
        featured: form.featured,
        published: form.published,
        images: finalImages,
      };

      const isEditing = editingId !== null;
      const response = await fetch(
        isEditing ? `/api/admin/cars/${editingId}` : "/api/admin/cars",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = (await response.json().catch(() => null)) as {
        vehicle?: CarItem;
        message?: string;
      } | null;

      if (!response.ok || !data?.vehicle) {
        setFormError(
          data?.message ?? "Unable to save this vehicle. Please try again.",
        );
        return;
      }

      const saved = data.vehicle;

      setCars((current) =>
        isEditing
          ? current.map((car) => (car.id === editingId ? saved : car))
          : [saved, ...current],
      );

      setSuccessMessage(
        isEditing
          ? "Vehicle updated successfully."
          : "Vehicle added successfully.",
      );

      releasePreviews(imagesRef.current);
      setImages([]);
      setModalOpen(false);
      setEditingId(null);
      setFormError("");

      await loadCars().catch(() => undefined);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to save this vehicle. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function togglePublished(id: string) {
    const car = cars.find((item) => item.id === id);
    if (!car) return;

    const nextPublished = !car.published;

    setActionError("");
    setCars((current) =>
      current.map((item) =>
        item.id === id ? { ...item, published: nextPublished } : item,
      ),
    );

    try {
      const response = await fetch(`/api/admin/cars/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: nextPublished }),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      const data = (await response.json()) as { vehicle?: CarItem };

      if (data.vehicle) {
        setCars((current) =>
          current.map((item) => (item.id === id ? data.vehicle! : item)),
        );
      }

      setSuccessMessage(
        nextPublished
          ? "Listing published to the public website."
          : "Listing unpublished and hidden from the public website.",
      );
    } catch {
      setCars((current) =>
        current.map((item) =>
          item.id === id ? { ...item, published: !nextPublished } : item,
        ),
      );
      setActionError("Unable to update the listing. Please try again.");
    }
  }

  async function confirmDelete() {
    if (deletingId === null) return;

    const id = deletingId;
    setActionError("");

    try {
      const response = await fetch(`/api/admin/cars/${id}`, {
        method: "DELETE",
      });

      if (!response.ok && response.status !== 404) {
        throw new Error("Request failed");
      }

      setCars((current) => current.filter((car) => car.id !== id));
      setDeletingId(null);
      setSuccessMessage("Vehicle deleted.");

      await loadCars().catch(() => undefined);
    } catch {
      setActionError("Unable to delete this vehicle. Please try again.");
    }
  }

  const inputClass =
    "input input-bordered w-full bg-base-100 focus:outline-primary";

  const selectClass =
    "select select-bordered w-full bg-base-100 focus:outline-primary";

  return (
    <main className="min-h-screen bg-base-200 text-base-content">
      <header className="border-b border-base-300 bg-base-100">
        <div className="navbar mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex-1">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2 text-sm opacity-70 transition hover:text-primary hover:opacity-100"
            >
              <ArrowLeft size={18} />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Dashboard</span>
            </Link>
          </div>

          <Link
            href="/admin/dashboard"
            className="text-lg font-bold sm:text-xl"
          >
            <span className="text-primary">Veltrix</span> Motors
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-7 px-4 py-7 sm:px-6 sm:py-10">
        <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="breadcrumbs mb-2 text-sm opacity-60">
              <ul>
                <li>
                  <Link href="/admin/dashboard">Admin</Link>
                </li>
                <li>Manage Cars</li>
              </ul>
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Car Inventory
            </h1>

            <p className="mt-2 text-sm opacity-65 sm:text-base">
              Manage your showroom vehicles and listing status.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="btn btn-primary gap-2"
          >
            <Plus size={19} />
            Add Car
          </button>
        </section>

        {successMessage && (
          <div
            role="status"
            aria-live="polite"
            className="alert alert-success text-sm"
          >
            <CheckCircle2 size={18} />
            <span>{successMessage}</span>
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={() => setSuccessMessage("")}
            >
              Dismiss
            </button>
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title="Total Cars"
            value={cars.length}
            description="Vehicles in inventory"
            icon={<CarFront size={21} />}
          />
          <StatCard
            title="Available Cars"
            value={availableCount}
            description="Ready for new buyers"
            icon={<Check size={21} />}
          />
          <StatCard
            title="Published Cars"
            value={publishedCount}
            description="Visible on public listings"
            icon={<Eye size={21} />}
          />
        </section>

        <section className="space-y-4">
          <div className="card border border-base-300 bg-base-100 shadow-sm">
            <div className="card-body gap-4 p-4 sm:p-5">
              <div className="flex items-center gap-2 font-semibold">
                <Settings2 size={19} className="text-primary" />
                Search & Filters
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="input input-bordered flex items-center gap-2 bg-base-100">
                  <Search size={18} className="shrink-0 opacity-50" />
                  <input
                    type="search"
                    className="grow"
                    placeholder="Search brand, model..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>

                <select
                  className={selectClass}
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  aria-label="Filter by availability"
                >
                  <option value="All">All Availability</option>
                  <option value="Available">Available</option>
                  <option value="Reserved">Reserved</option>
                  <option value="Sold">Sold</option>
                </select>

                <select
                  className={selectClass}
                  value={publicationFilter}
                  onChange={(event) =>
                    setPublicationFilter(event.target.value)
                  }
                  aria-label="Filter by publication"
                >
                  <option value="All">All Listings</option>
                  <option value="Published">Published</option>
                  <option value="Unpublished">Unpublished</option>
                </select>

                <select
                  className={selectClass}
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value)}
                  aria-label="Sort vehicles"
                >
                  <option value="newest">Newest Year</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm opacity-65">
              Showing{" "}
              <span className="font-semibold text-base-content">
                {filteredCars.length}
              </span>{" "}
              of {cars.length} vehicles
            </p>

            {(search ||
              statusFilter !== "All" ||
              publicationFilter !== "All") && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("All");
                  setPublicationFilter("All");
                }}
              >
                <X size={15} />
                Clear filters
              </button>
            )}
          </div>

          {actionError && (
            <p role="alert" className="alert alert-error text-sm">
              {actionError}
            </p>
          )}

          {isLoading ? (
            <div className="card border border-base-300 bg-base-100">
              <div className="card-body items-center px-5 py-14 text-center">
                <span className="loading loading-spinner loading-lg" />
                <p className="mt-3 text-sm opacity-65">Loading inventory…</p>
              </div>
            </div>
          ) : loadError ? (
            <div className="card border border-error/40 bg-base-100">
              <div className="card-body items-center px-5 py-14 text-center">
                <h2 className="text-xl font-bold">Unable to load inventory</h2>
                <p className="max-w-sm text-sm opacity-65">{loadError}</p>
              </div>
            </div>
          ) : filteredCars.length === 0 ? (
            <div className="card border border-base-300 bg-base-100">
              <div className="card-body items-center px-5 py-14 text-center">
                <div className="rounded-full bg-base-200 p-4">
                  <CarFront size={30} className="opacity-50" />
                </div>
                <h2 className="mt-2 text-xl font-bold">No cars found</h2>
                <p className="max-w-sm text-sm opacity-65">
                  Try changing your search or filters, or add a new vehicle.
                </p>
                <button
                  type="button"
                  onClick={openAddModal}
                  className="btn btn-primary mt-3"
                >
                  <Plus size={18} />
                  Add Your First Car
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredCars.map((car) => (
                <article
                  key={car.id}
                  className="card overflow-hidden border border-base-300 bg-base-100 shadow-sm transition duration-200 hover:shadow-md"
                >
                  <figure className="relative aspect-[16/10] bg-base-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={car.image}
                      alt={`${car.brand} ${car.model}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.src = DEFAULT_VEHICLE_IMAGE;
                      }}
                    />

                    <span
                      className={`badge absolute left-3 top-3 border-0 font-medium ${
                        car.status === "Available"
                          ? "badge-success"
                          : car.status === "Reserved"
                            ? "badge-warning"
                            : "badge-neutral"
                      }`}
                    >
                      {car.status}
                    </span>

                    <span
                      className={`badge absolute right-3 top-3 border-0 ${
                        car.published ? "badge-primary" : "badge-ghost"
                      }`}
                    >
                      {car.published ? "Published" : "Draft"}
                    </span>
                  </figure>

                  <div className="card-body gap-4 p-4 sm:p-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                        {car.brand}
                      </p>
                      <h2 className="mt-1 text-xl font-bold">
                        {car.model}{" "}
                        <span className="font-normal opacity-60">
                          {car.year}
                        </span>
                      </h2>
                      <p className="mt-2 text-2xl font-bold">
                        {money(car.price)}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-y border-base-300 py-3">
                      <div className="flex items-center gap-2 text-sm opacity-75">
                        <Gauge size={17} className="shrink-0 text-primary" />
                        <span>{car.mileage.toLocaleString()} km</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm opacity-75">
                        <Fuel size={17} className="shrink-0 text-primary" />
                        <span>{car.fuel}</span>
                      </div>
                      <div className="col-span-2 flex items-center gap-2 text-sm opacity-75">
                        <Settings2 size={17} className="shrink-0 text-primary" />
                        <span>{car.transmission}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => openEditModal(car)}
                      >
                        <Pencil size={15} />
                        Edit
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => setDeletingId(car.id)}
                      >
                        <Trash2 size={15} />
                        Delete
                      </button>
                    </div>

                    <button
                      type="button"
                      className={`btn btn-sm ${
                        car.published ? "btn-ghost" : "btn-primary"
                      }`}
                      onClick={() => togglePublished(car.id)}
                    >
                      {car.published ? (
                        <>
                          <EyeOff size={16} />
                          Unpublish Listing
                        </>
                      ) : (
                        <>
                          <Eye size={16} />
                          Publish Listing
                        </>
                      )}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="pb-3 pt-2 text-center text-xs opacity-50">
          Veltrix Motors · Admin Inventory
        </footer>
      </div>

      {modalOpen && (
        <div className="modal modal-open z-50">
          <div className="modal-box max-w-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">
                  {editingId === null ? "Add New Car" : "Edit Car"}
                </h2>
                <p className="mt-1 text-sm opacity-65">
                  Enter the vehicle information and upload photos below.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-square"
                onClick={closeModal}
                aria-label="Close form"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={saveCar} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="form-control gap-1">
                  <span className="label-text font-medium">Brand *</span>
                  <input
                    className={inputClass}
                    placeholder="e.g. Toyota"
                    value={form.brand}
                    onChange={(event) =>
                      setForm({ ...form, brand: event.target.value })
                    }
                    required
                  />
                </label>

                <label className="form-control gap-1">
                  <span className="label-text font-medium">Model *</span>
                  <input
                    className={inputClass}
                    placeholder="e.g. Camry"
                    value={form.model}
                    onChange={(event) =>
                      setForm({ ...form, model: event.target.value })
                    }
                    required
                  />
                </label>

                <label className="form-control gap-1">
                  <span className="label-text font-medium">Category</span>
                  <input
                    className={inputClass}
                    placeholder="e.g. Luxury Sedan"
                    value={form.category}
                    onChange={(event) =>
                      setForm({ ...form, category: event.target.value })
                    }
                  />
                </label>

                <label className="form-control gap-1">
                  <span className="label-text font-medium">Year *</span>
                  <input
                    className={inputClass}
                    type="number"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    value={form.year}
                    onChange={(event) =>
                      setForm({ ...form, year: event.target.value })
                    }
                    required
                  />
                </label>

                <label className="form-control gap-1">
                  <span className="label-text font-medium">Price (BDT) *</span>
                  <input
                    className={inputClass}
                    type="number"
                    min="1"
                    placeholder="3500000"
                    value={form.price}
                    onChange={(event) =>
                      setForm({ ...form, price: event.target.value })
                    }
                    required
                  />
                </label>

                <label className="form-control gap-1">
                  <span className="label-text font-medium">Mileage (km) *</span>
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    placeholder="24000"
                    value={form.mileage}
                    onChange={(event) =>
                      setForm({ ...form, mileage: event.target.value })
                    }
                    required
                  />
                </label>

                <label className="form-control gap-1">
                  <span className="label-text font-medium">Fuel Type</span>
                  <select
                    className={selectClass}
                    value={form.fuel}
                    onChange={(event) =>
                      setForm({ ...form, fuel: event.target.value })
                    }
                  >
                    <option>Petrol</option>
                    <option>Diesel</option>
                    <option>Hybrid</option>
                    <option>Electric</option>
                    <option>CNG</option>
                  </select>
                </label>

                <label className="form-control gap-1">
                  <span className="label-text font-medium">Transmission</span>
                  <select
                    className={selectClass}
                    value={form.transmission}
                    onChange={(event) =>
                      setForm({ ...form, transmission: event.target.value })
                    }
                  >
                    <option>Automatic</option>
                    <option>Manual</option>
                    <option>CVT</option>
                  </select>
                </label>

                <label className="form-control gap-1">
                  <span className="label-text font-medium">Condition</span>
                  <select
                    className={selectClass}
                    value={form.condition}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        condition: event.target.value as CarCondition,
                      })
                    }
                  >
                    <option value="Used">Used</option>
                    <option value="New">New</option>
                  </select>
                </label>

                <label className="form-control gap-1">
                  <span className="label-text font-medium">Availability</span>
                  <select
                    className={selectClass}
                    value={form.status}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        status: event.target.value as CarStatus,
                      })
                    }
                  >
                    <option value="Available">Available</option>
                    <option value="Reserved">Reserved</option>
                    <option value="Sold">Sold</option>
                  </select>
                </label>

                <CarPhotoUploader
                  images={images}
                  onChange={setImages}
                  disabled={isSaving}
                />

                <div className="grid grid-cols-1 gap-3 sm:col-span-2 sm:grid-cols-2">
                  <label className="flex cursor-pointer items-center gap-3 rounded-box border border-base-300 p-3">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={form.published}
                      onChange={(event) =>
                        setForm({ ...form, published: event.target.checked })
                      }
                    />
                    <span>
                      <span className="block font-medium">Publish listing</span>
                      <span className="text-xs opacity-60">
                        Published vehicles appear on the public website.
                      </span>
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-3 rounded-box border border-base-300 p-3">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={form.featured}
                      onChange={(event) =>
                        setForm({ ...form, featured: event.target.checked })
                      }
                    />
                    <span>
                      <span className="block font-medium">Featured vehicle</span>
                      <span className="text-xs opacity-60">
                        Featured vehicles are highlighted first.
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              {formError && (
                <p role="alert" className="alert alert-error text-sm">
                  {formError}
                </p>
              )}

              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={closeModal}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-primary"
                >
                  {isSaving
                    ? "Saving…"
                    : editingId === null
                      ? "Add Car"
                      : "Save Changes"}
                </button>
              </div>
            </form>
          </div>

          <button
            type="button"
            className="modal-backdrop"
            aria-label="Close modal"
            onClick={closeModal}
          >
            Close
          </button>
        </div>
      )}

      {deletingId !== null && (
        <div className="modal modal-open z-[60]">
          <div className="modal-box max-w-md">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-error/10 text-error">
              <Trash2 size={23} />
            </div>
            <h2 className="mt-4 text-center text-xl font-bold">
              Delete this car?
            </h2>
            <p className="mt-2 text-center text-sm opacity-65">
              This will remove the car from your inventory. This action
              cannot be undone.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setDeletingId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-error"
                onClick={confirmDelete}
              >
                <Trash2 size={16} />
                Delete Car
              </button>
            </div>
          </div>
          <button
            type="button"
            className="modal-backdrop"
            aria-label="Cancel deletion"
            onClick={() => setDeletingId(null)}
          >
            Close
          </button>
        </div>
      )}
    </main>
  );
}

function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="card border border-base-300 bg-base-100 shadow-sm">
      <div className="card-body gap-4 p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium opacity-65">{title}</p>
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
            {icon}
          </div>
        </div>
        <p className="text-3xl font-bold">{value}</p>
        <p className="text-xs opacity-55">{description}</p>
      </div>
    </div>
  );
}
