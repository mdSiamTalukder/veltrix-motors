"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Vehicle } from "@/types";
import { getVehicleImages } from "@/lib/vehicle-images";
import { DEFAULT_VEHICLE_IMAGE } from "@/lib/validation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useTheme } from "@/components/theme";

const heroCars = [
  {
    name: "Mercedes-Benz",
    model: "Luxury, Reimagined.",
    image:
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=2000&q=90",
  },
  {
    name: "BMW",
    model: "Made for the Drive.",
    image:
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=2000&q=90",
  },
  {
    name: "Porsche",
    model: "Born to Stand Out.",
    image:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=2000&q=90",
  },
];

const formatPrice = (price: number) =>
  `৳ ${new Intl.NumberFormat("en-BD").format(price)}`;

function featuredImage(vehicle: Vehicle): string {
  return getVehicleImages(vehicle)[0] ?? DEFAULT_VEHICLE_IMAGE;
}

export default function Home() {
  const [activeSlide, setActiveSlide] = useState(0);
  const { darkMode } = useTheme();

  const [featured, setFeatured] = useState<Vehicle[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/cars?limit=3", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Request failed");
        }
        return (await response.json()) as { vehicles?: Vehicle[] };
      })
      .then((data) => {
        setFeatured(data.vehicles ?? []);
      })
      .catch((error: Error) => {
        if (error.name === "AbortError") return;
        setFeatured([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setFeaturedLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  // Hero text colors follow the selected theme.
  const heroText = darkMode ? "text-white" : "text-black";
  const heroMutedText = darkMode ? "text-white/75" : "text-black/75";
  const heroSecondaryText = darkMode ? "text-white/90" : "text-black/90";

  const heroOverlay = darkMode
    ? "bg-gradient-to-r from-neutral via-neutral/80 to-neutral/20"
    : "bg-gradient-to-r from-white via-white/80 to-white/20";

  const heroPill = darkMode
    ? "border-white/25 bg-black/20"
    : "border-black/20 bg-white/70";

  const heroBorder = darkMode ? "border-white/25" : "border-black/25";

  const heroOutlineButton = darkMode
    ? "border-white/50 text-white hover:bg-white hover:text-neutral"
    : "border-black/50 text-black hover:bg-black hover:text-white";

  const carouselInactiveDot = darkMode
    ? "bg-white/50 hover:bg-white"
    : "bg-black/40 hover:bg-black/70";

  return (
    <main className="min-h-screen bg-base-100 text-base-content">
      <Navbar />

      {/* HERO CAROUSEL */}
      <section
        id="home"
        className={`relative isolate overflow-hidden ${heroText}`}
      >
        {heroCars.map((car, index) => (
          <div
            key={car.name}
            aria-hidden={index !== activeSlide}
            className={`absolute inset-0 -z-20 transition-opacity duration-1000 ${
              index === activeSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={car.image}
              alt=""
              className="size-full object-cover object-center"
            />
          </div>
        ))}

        <div className={`absolute inset-0 -z-10 ${heroOverlay}`} />

        <div className="mx-auto grid min-h-[600px] max-w-7xl items-center px-4 py-20 sm:px-6 md:min-h-[680px] lg:grid-cols-2 lg:px-8">
          <div className="max-w-2xl">
            <div
              className={`inline-flex items-center gap-2 rounded-full border ${heroPill} px-4 py-2 text-xs font-semibold tracking-widest ${heroText} backdrop-blur-sm`}
            >
              <span className="size-2 rounded-full bg-primary" />
              YOUR NEXT DRIVE STARTS HERE
            </div>

            <h1
              className={`mt-7 text-5xl font-black leading-[1.08] tracking-tight ${heroText} sm:text-6xl lg:text-7xl`}
            >
              Drive Your
              <br />
              <span className={heroText}>Own Story.</span>
            </h1>

            <p className={`mt-5 max-w-lg text-lg font-medium ${heroText}`}>
              {heroCars[activeSlide].name}
            </p>

            <p
              className={`mt-3 max-w-lg text-base leading-8 ${heroSecondaryText} sm:text-lg`}
            >
              {heroCars[activeSlide].model} Discover exceptional cars,
              thoughtfully selected for the way you want to drive.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/cars"
                className={`btn btn-lg rounded-full px-8 transition-colors duration-300 ${
                  darkMode
                    ? "bg-black text-white border border-white hover:bg-white hover:text-black"
                    : "bg-white text-black border border-black hover:bg-black hover:text-white"
                }`}
              >
                Explore Collection ↗
              </Link>
              <Link
                href="#about"
                className={`btn btn-outline btn-lg rounded-full ${heroOutlineButton}`}
              >
                Discover Veltrix
              </Link>
            </div>

            <div
              className={`mt-12 grid max-w-md grid-cols-3 gap-5 border-t ${heroBorder} pt-7`}
            >
              <div>
                <p className={`text-xl font-black sm:text-2xl ${heroText}`}>
                  Premium
                </p>
                <p className={`mt-1 text-xs sm:text-sm ${heroMutedText}`}>
                  Car selection
                </p>
              </div>
              <div>
                <p className={`text-xl font-black sm:text-2xl ${heroText}`}>
                  Personal
                </p>
                <p className={`mt-1 text-xs sm:text-sm ${heroMutedText}`}>
                  Assistance
                </p>
              </div>
              <div>
                <p className={`text-xl font-black sm:text-2xl ${heroText}`}>
                  Trusted
                </p>
                <p className={`mt-1 text-xs sm:text-sm ${heroMutedText}`}>
                  Service
                </p>
              </div>
            </div>
          </div>

          <div className="hidden lg:block" aria-hidden="true" />
        </div>

        {/* CAROUSEL CONTROLS */}
        <div
          className={`absolute bottom-7 left-0 right-0 mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 ${heroText}`}
        >
          <div className="flex items-center gap-3">
            <span className={`text-sm font-bold ${heroText}`}>
              0{activeSlide + 1}
            </span>

            <div className="flex gap-2">
              {heroCars.map((car, index) => (
                <button
                  key={car.name}
                  type="button"
                  aria-label={`Show ${car.name} slide`}
                  aria-current={index === activeSlide ? "true" : undefined}
                  onClick={() => setActiveSlide(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === activeSlide
                      ? "w-10 bg-primary"
                      : `w-5 ${carouselInactiveDot}`
                  }`}
                />
              ))}
            </div>

            <span className={`text-sm ${heroMutedText}`}>03</span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                setActiveSlide(
                  (current) =>
                    (current - 1 + heroCars.length) % heroCars.length,
                )
              }
              className={`btn btn-circle btn-outline ${heroOutlineButton}`}
              aria-label="Previous car"
            >
              ←
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveSlide((current) => (current + 1) % heroCars.length)
              }
              className={`btn btn-circle btn-outline ${heroOutlineButton}`}
              aria-label="Next car"
            >
              →
            </button>
          </div>
        </div>
      </section>

      {/* FEATURED CARS */}
      <section
        id="inventory"
        className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
      >
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold tracking-[0.25em] text-gray-500">
              THE COLLECTION
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              Featured Vehicles
            </h2>
            <p className="mt-4 max-w-xl leading-7 opacity-65">
              Discover a collection of vehicles selected for different tastes,
              lifestyles, and driving ambitions.
            </p>
          </div>

          <Link href="/cars" className="btn btn-outline rounded-full">
            View All Cars ↗
          </Link>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featuredLoading
            ? Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="card overflow-hidden border border-base-300 bg-base-100"
                >
                  <div className="aspect-[16/10] animate-pulse bg-base-200" />
                  <div className="card-body gap-4 p-5 sm:p-6">
                    <div className="h-4 w-24 animate-pulse rounded bg-base-200" />
                    <div className="h-6 w-40 animate-pulse rounded bg-base-200" />
                    <div className="h-7 w-32 animate-pulse rounded bg-base-200" />
                  </div>
                </div>
              ))
            : featured.map((car) => (
                <article
                  key={car.id}
                  className="card overflow-hidden border border-base-300 bg-base-100 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <figure className="aspect-[16/10] overflow-hidden bg-base-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={featuredImage(car)}
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
                        {car.category || "Vehicle"}
                      </span>
                      <h3 className="mt-3 text-xl font-bold">
                        {car.brand} {car.model}
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
                        <p className="text-xs font-bold opacity-60">MILEAGE</p>
                        <p className="mt-1">
                          {new Intl.NumberFormat("en-BD").format(car.mileage)} km
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/cars/${car.id}`}
                      className="btn btn-outline mt-1 rounded-xl border-gray-500 text-gray-500 hover:bg-gray-500 hover:text-white"
                    >
                      View Details ↗
                    </Link>
                  </div>
                </article>
              ))}
        </div>

        {!featuredLoading && featured.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-base-300 px-5 py-16 text-center">
            <h3 className="text-xl font-bold">No vehicles published yet</h3>
            <p className="mt-2 text-sm opacity-60">
              Published vehicles from the admin dashboard will appear here.
            </p>
            <Link href="/cars" className="btn btn-outline mt-5 rounded-full">
              Browse Collection
            </Link>
          </div>
        )}

        <p className="mt-6 text-xs leading-6 opacity-50">
          Demo vehicles only. Prices and specifications are illustrative and
          must be verified before publication.
        </p>
      </section>

      {/* ABOUT */}
      <section id="about" className="bg-base-200">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-24">
          <div>
            <p className="text-xs font-bold tracking-[0.25em] text-primary">
              MORE THAN A SHOWROOM
            </p>
            <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              A better way to
              <br />
              find your next car.
            </h2>
            <p className="mt-6 leading-8 opacity-70">
              At Veltrix Motors, we believe choosing a car should feel exciting,
              clear, and personal. Explore your options and find a vehicle that
              suits your lifestyle.
            </p>
            <Link
              href="/cars"
              className={`btn mt-8 rounded-full px-7 transition-colors duration-300 ${
                darkMode
                  ? "bg-black text-white border border-white hover:bg-white hover:text-black"
                  : "bg-white text-black border border-black hover:bg-black hover:text-white"
              }`}
            >
              Explore Our Collection ↗
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                number: "01",
                title: "Quality Assured",
                description:
                  "Carefully reviewed vehicle information and a considered collection.",
              },
              {
                number: "02",
                title: "Clear Information",
                description:
                  "Understand vehicle details before making a decision.",
              },
              {
                number: "03",
                title: "Personal Support",
                description:
                  "Get help exploring vehicles that fit your requirements.",
              },
              {
                number: "04",
                title: "Customer Focus",
                description:
                  "A more personal experience from browsing to enquiry.",
              },
            ].map((item) => (
              <div
                key={item.number}
                className="rounded-2xl border border-base-300 bg-base-100 p-6 sm:p-7"
              >
                <span className="text-sm font-black text-primary">
                  {item.number}
                </span>
                <h3 className="mt-5 text-lg font-bold">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 opacity-65">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section
        id="contact"
        className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
      >
        <div className="relative overflow-hidden rounded-3xl bg-gray-500 p-8 text-white sm:p-12 lg:p-16">
          <div className="relative z-10 max-w-2xl">
            <p className="text-xs font-bold tracking-[0.25em] opacity-80">
              LET&apos;S FIND YOUR NEXT CAR
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              Your next journey starts with a conversation.
            </h2>

            <p className="mt-5 max-w-xl leading-7 opacity-85">
              Have a particular vehicle in mind? Get in touch to discuss your
              requirements.
            </p>

            <a
              href="mailto:veltrixmotors@veltrixmotors.com"
              className={`btn mt-8 rounded-full px-8 transition-colors duration-300 ${
                darkMode
                  ? "border border-white bg-black text-white hover:bg-white hover:text-black"
                  : "border border-black bg-white text-black hover:bg-black hover:text-white"
              }`}
            >
              Contact Our Team ↗
            </a>
          </div>

          <div className="absolute -right-12 -top-20 size-64 rounded-full border border-white/20 sm:size-80" />
          <div className="absolute -right-2 -top-10 size-48 rounded-full border border-white/20 sm:size-64" />
        </div>
      </section>

      <Footer />
    </main>
  );
}
