"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import type { Vehicle } from "@/types";
import { getVehicleImages } from "@/lib/vehicle-images";
import { DEFAULT_VEHICLE_IMAGE } from "@/lib/validation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const formatPrice = (price: number) =>
  `৳ ${new Intl.NumberFormat("en-BD").format(price)}`;

type InquiryForm = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

const initialForm: InquiryForm = {
  name: "",
  email: "",
  phone: "",
  message: "",
};

type SubmitState = "idle" | "submitting" | "success" | "error";

export default function VehicleDetails({ id }: { id: string }) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(id !== "");
  const [notFound, setNotFound] = useState(id === "");
  const [loadError, setLoadError] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [form, setForm] = useState<InquiryForm>(initialForm);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formMessage, setFormMessage] = useState("");

  const gallery = vehicle ? getVehicleImages(vehicle) : [];
  const activeImage =
    gallery[activeImageIndex] ?? gallery[0] ?? DEFAULT_VEHICLE_IMAGE;

  useEffect(() => {
    if (!id) {
      return;
    }

    const controller = new AbortController();
    let active = true;

    fetch(`/api/cars/${encodeURIComponent(id)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status === 404) {
          if (active) {
            setNotFound(true);
            setLoading(false);
          }
          return null;
        }

        if (!response.ok) {
          throw new Error("Request failed");
        }

        return (await response.json()) as { vehicle: Vehicle };
      })
      .then((data) => {
        if (!active || !data) return;
        setVehicle(data.vehicle);
        setActiveImageIndex(0);
        setLoading(false);
      })
      .catch((error: Error) => {
        if (error.name === "AbortError") return;
        if (!active) return;
        setLoadError("Unable to load this vehicle right now.");
        setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [id]);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitState("submitting");
    setFieldErrors({});
    setFormMessage("");

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          subject: vehicle ? `Inquiry: ${vehicle.brand} ${vehicle.model}` : "Vehicle inquiry",
          vehicleId: vehicle?.id ?? null,
        }),
      });

      const data = (await response.json()) as {
        message?: string;
        fields?: Record<string, string>;
      };

      if (!response.ok) {
        setFieldErrors(data.fields ?? {});
        setFormMessage(data.message ?? "Unable to submit your inquiry.");
        setSubmitState("error");
        return;
      }

      setSubmitState("success");
    } catch {
      setFormMessage("Unable to submit your inquiry. Please try again.");
      setSubmitState("error");
    }
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-base-100 text-base-content">
        <section className="border-b border-base-300 bg-base-200">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <Link
              href="/cars"
              className="text-sm font-semibold text-gray-500 transition-colors hover:text-gray-700"
            >
              ← Back to Collection
            </Link>
          </div>
        </section>

        {loading ? (
          <section className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-20 text-sm opacity-70 sm:px-6 lg:px-8">
            <span className="loading loading-spinner loading-md" />
            Loading vehicle…
          </section>
        ) : notFound || loadError || !vehicle ? (
          <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-dashed border-base-300 px-5 py-16 text-center">
              <h1 className="text-2xl font-bold">
                {notFound ? "Vehicle not available" : "Something went wrong"}
              </h1>

              <p className="mt-3 text-sm opacity-65">
                {notFound
                  ? "This vehicle may have been removed or is not published."
                  : loadError || "Unable to load this vehicle right now."}
              </p>

              <Link href="/cars" className="btn btn-primary mt-6 rounded-full">
                Back to All Cars
              </Link>
            </div>
          </section>
        ) : (
          <section className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14 lg:px-8 lg:py-16">
            <div>
              <figure className="overflow-hidden rounded-2xl border border-base-300 bg-base-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeImage}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  className="aspect-[16/10] w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.src = DEFAULT_VEHICLE_IMAGE;
                  }}
                />
              </figure>

              {gallery.length > 1 && (
                <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
                  {gallery.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setActiveImageIndex(index)}
                      aria-label={`View photo ${index + 1}`}
                      aria-current={index === activeImageIndex}
                      className={`overflow-hidden rounded-xl border-2 bg-base-200 transition ${
                        index === activeImageIndex
                          ? "border-gray-500"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image}
                        alt={`${vehicle.brand} ${vehicle.model} photo ${index + 1}`}
                        loading="lazy"
                        className="aspect-[4/3] w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.src = DEFAULT_VEHICLE_IMAGE;
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-8">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="badge border-0 bg-gray-500 text-xs text-white">
                    {vehicle.category}
                  </span>

                  <span
                    className={`badge border-0 text-xs ${
                      vehicle.status === "Available"
                        ? "badge-success"
                        : vehicle.status === "Reserved"
                          ? "badge-warning"
                          : "badge-neutral"
                    }`}
                  >
                    {vehicle.status}
                  </span>
                </div>

                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
                  {vehicle.brand}
                </p>

                <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                  {vehicle.model}
                </h1>

                <p className="mt-4 text-3xl font-black text-gray-500">
                  {formatPrice(vehicle.price)}
                </p>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4 border-y border-base-300 py-6 sm:grid-cols-4">
                {[
                  { label: "YEAR", value: String(vehicle.year) },
                  {
                    label: "MILEAGE",
                    value: `${new Intl.NumberFormat("en-BD").format(vehicle.mileage)} km`,
                  },
                  { label: "TRANSMISSION", value: vehicle.transmission },
                  { label: "FUEL", value: vehicle.fuel },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs font-bold opacity-60">
                      {item.label}
                    </p>
                    <p className="mt-1 font-medium">{item.value}</p>
                  </div>
                ))}
              </div>

              <p className="mt-6 text-xs leading-6 opacity-50">
                Vehicle information is provided for demonstration and must be
                verified before publication.
              </p>
            </div>

            <div className="h-fit rounded-2xl border border-base-300 bg-base-100 p-5 sm:p-8">
              <div className="border-b border-base-300 pb-5">
                <h2 className="text-xl font-semibold tracking-tight">
                  Request details
                </h2>
                <p className="mt-2 text-sm leading-6 text-base-content/60">
                  Send an inquiry about the {vehicle.brand} {vehicle.model} and
                  our team will get back to you.
                </p>
              </div>

              {submitState === "success" ? (
                <div className="py-10" role="status" aria-live="polite">
                  <div className="flex size-12 items-center justify-center rounded-full bg-base-200 text-xl">
                    ✓
                  </div>

                  <h3 className="mt-5 text-xl font-semibold">
                    Thank you for reaching out.
                  </h3>

                  <p className="mt-2 text-sm leading-7 text-base-content/65">
                    Your inquiry has been received. Our team will contact you
                    using the details you provided.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setForm(initialForm);
                      setSubmitState("idle");
                    }}
                    className="btn btn-outline mt-6 rounded-full"
                  >
                    Send another inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5 pt-6">
                  <label className="form-control w-full">
                    <span className="label-text mb-2 font-medium">
                      Full name <span className="text-gray-500">*</span>
                    </span>
                    <input
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder="Your full name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      className="input input-bordered w-full bg-base-100"
                    />
                    {fieldErrors.name && (
                      <span className="mt-1 text-xs text-error">
                        {fieldErrors.name}
                      </span>
                    )}
                  </label>

                  <label className="form-control w-full">
                    <span className="label-text mb-2 font-medium">
                      Email address <span className="text-gray-500">*</span>
                    </span>
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className="input input-bordered w-full bg-base-100"
                    />
                    {fieldErrors.email && (
                      <span className="mt-1 text-xs text-error">
                        {fieldErrors.email}
                      </span>
                    )}
                  </label>

                  <label className="form-control w-full">
                    <span className="label-text mb-2 font-medium">
                      Phone number
                    </span>
                    <input
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="Your phone number"
                      value={form.phone}
                      onChange={handleChange}
                      className="input input-bordered w-full bg-base-100"
                    />
                    {fieldErrors.phone && (
                      <span className="mt-1 text-xs text-error">
                        {fieldErrors.phone}
                      </span>
                    )}
                  </label>

                  <label className="form-control w-full">
                    <span className="label-text mb-2 font-medium">
                      Your message <span className="text-gray-500">*</span>
                    </span>
                    <textarea
                      name="message"
                      placeholder="Tell us what you would like to know about this vehicle..."
                      value={form.message}
                      onChange={handleChange}
                      required
                      rows={4}
                      className="textarea textarea-bordered min-h-28 w-full resize-y bg-base-100 leading-7"
                    />
                    {fieldErrors.message && (
                      <span className="mt-1 text-xs text-error">
                        {fieldErrors.message}
                      </span>
                    )}
                  </label>

                  {submitState === "error" && formMessage && (
                    <p role="alert" className="alert alert-error text-sm">
                      {formMessage}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submitState === "submitting"}
                    className="btn w-full rounded-full bg-gray-500 text-white hover:bg-gray-600"
                  >
                    {submitState === "submitting"
                      ? "Submitting…"
                      : "Submit inquiry"}
                  </button>
                </form>
              )}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
