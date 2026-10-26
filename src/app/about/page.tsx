
"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const principles = [
  {
    number: "01",
    title: "Clarity over confusion",
    description:
      "Vehicle information should be easy to understand, helping you explore your options with confidence.",
  },
  {
    number: "02",
    title: "Your needs come first",
    description:
      "The right vehicle depends on your lifestyle, priorities, and the way you want to drive.",
  },
  {
    number: "03",
    title: "Every detail matters",
    description:
      "From exploring a vehicle to making your next decision, the experience should feel considered and straightforward.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen overflow-hidden bg-base-100 text-base-content">
        {/* Editorial Hero */}
        <section className="relative border-b border-base-300">
          <div className="mx-auto grid max-w-7xl lg:min-h-[650px] lg:grid-cols-[1.15fr_0.85fr]">
            <div className="flex flex-col justify-center px-5 py-16 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
              <div className="flex items-center gap-3">
                <span className="h-px w-10 bg-gray-500" />
                <p className="text-xs font-bold tracking-[0.25em] text-gray-500">
                  THE STORY BEHIND VELTRIX
                </p>
              </div>

              <h1 className="mt-8 max-w-3xl text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                Driving your
                <br />
                <span className="text-gray-500">next chapter.</span>
              </h1>

              <p className="mt-7 max-w-xl text-base leading-8 opacity-70 sm:text-lg">
                Every great journey begins with a choice. At Veltrix Motors,
                we make discovering that next vehicle a more thoughtful,
                personal, and enjoyable experience.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-6">
                <Link
                  href="/cars"
                  className="btn rounded-full border-gray-500 bg-gray-500 px-7 text-white transition-colors hover:border-gray-700 hover:bg-gray-700"
                >
                  Discover Our Collection ↗
                </Link>

                <a
                  href="#our-story"
                  className="text-sm font-semibold underline decoration-gray-500 underline-offset-8 transition-opacity hover:opacity-60"
                >
                  Get to know us
                </a>
              </div>

              <div className="mt-14 flex items-center gap-4 border-t border-base-300 pt-6">
                <span className="text-3xl font-black text-gray-500">V.</span>
                <div>
                  <p className="text-sm font-bold">Veltrix Motors</p>
                  <p className="mt-1 text-xs opacity-60">
                    A considered approach to finding your car.
                  </p>
                </div>
              </div>
            </div>

            {/* Original graphic composition, not a homepage hero image */}
            <div className="relative flex min-h-[390px] items-center justify-center overflow-hidden bg-neutral-950 px-6 py-16 text-white sm:min-h-[480px] lg:min-h-full">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(156,156,156,0.20),transparent_60%)]" />

              <div className="absolute left-6 top-8 text-[10px] font-semibold tracking-[0.3em] text-white/50 sm:left-10 sm:top-10">
                EST. ON THE ROAD
              </div>

              <div className="relative flex aspect-square w-full max-w-[380px] items-center justify-center">
                <div className="absolute inset-[5%] rounded-full border border-white/10" />
                <div className="absolute inset-[15%] rounded-full border border-white/15" />
                <div className="absolute inset-[25%] rounded-full border border-white/20" />
                <div className="absolute inset-[35%] rounded-full border border-white/25" />

                <div className="absolute h-px w-full rotate-[-35deg] bg-white/20" />
                <div className="absolute h-px w-full rotate-[35deg] bg-white/20" />

                <div className="relative z-10 flex size-36 items-center justify-center rounded-full border border-white/30 bg-neutral-950 shadow-2xl sm:size-44">
                  <div className="text-center">
                    <span className="block text-5xl font-black tracking-tighter sm:text-6xl">
                      V.
                    </span>
                    <span className="mt-2 block text-[9px] font-semibold tracking-[0.3em] text-white/60">
                      MOTORS
                    </span>
                  </div>
                </div>

                <span className="absolute right-[4%] top-[18%] size-2 rounded-full bg-white" />
                <span className="absolute bottom-[12%] left-[18%] size-1.5 rounded-full bg-white/60" />
              </div>

              <div className="absolute inset-x-6 bottom-8 flex items-end justify-between border-t border-white/20 pt-4 sm:inset-x-10 sm:bottom-10">
                <p className="text-xs tracking-widest text-white/60">
                  BEHIND EVERY JOURNEY
                </p>
                <span className="text-sm font-bold tracking-widest">01 / 04</span>
              </div>
            </div>
          </div>
        </section>

        {/* Our Story: Editorial layout */}
        <section
          id="our-story"
          className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28 lg:px-12"
        >
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
            <div>
              <p className="text-xs font-bold tracking-[0.25em] text-gray-500">
                01 — OUR STORY
              </p>

              <h2 className="mt-5 max-w-sm text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                It starts with the way you want to move.
              </h2>
            </div>

            <div className="lg:border-l lg:border-base-300 lg:pl-12">
              <p className="text-xl font-semibold leading-relaxed sm:text-2xl">
                A car is not just a destination. It is part of the life you
                build along the way.
              </p>

              <p className="mt-6 leading-8 opacity-70">
                That idea shapes the way we think about Veltrix Motors. We
                bring together a selection of vehicles for different
                preferences, routines, and ambitions, giving you a place to
                begin your search.
              </p>

              <p className="mt-4 leading-8 opacity-70">
                We believe finding a vehicle should feel less overwhelming
                and more personal. Clear information, an easy browsing
                experience, and the freedom to explore your options are all
                part of that journey.
              </p>

              <div className="mt-8">
                <Link
                  href="/cars"
                  className="inline-flex items-center gap-3 text-sm font-bold transition-colors hover:text-gray-500"
                >
                  Take a look around
                  <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Mission and Vision */}
        <section className="border-y border-base-300">
          <div className="mx-auto grid max-w-7xl md:grid-cols-2">
            <article className="border-b border-base-300 px-5 py-12 sm:px-8 sm:py-16 md:border-b-0 md:border-r lg:px-12 lg:py-20">
              <p className="text-xs font-bold tracking-[0.25em] text-gray-500">
                02 — OUR MISSION
              </p>

              <h2 className="mt-6 text-3xl font-black tracking-tight sm:text-4xl">
                Make the search feel simple.
              </h2>

              <p className="mt-5 max-w-lg leading-8 opacity-70">
                Our mission is to help people discover vehicles that fit
                their needs through an accessible, straightforward, and
                considered browsing experience.
              </p>
            </article>

            <article className="px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
              <p className="text-xs font-bold tracking-[0.25em] text-gray-500">
                03 — OUR VISION
              </p>

              <h2 className="mt-6 text-3xl font-black tracking-tight sm:text-4xl">
                Put the driver at the centre.
              </h2>

              <p className="mt-5 max-w-lg leading-8 opacity-70">
                We envision a car-discovery experience where people can
                explore their choices with greater clarity and feel more
                confident about the journey ahead.
              </p>
            </article>
          </div>
        </section>

        {/* Principles: Editorial rows instead of cards */}
        <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
            <div>
              <p className="text-xs font-bold tracking-[0.25em] text-gray-500">
                04 — WHAT GUIDES US
              </p>

              <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
                The principles behind every decision.
              </h2>

              <p className="mt-5 leading-7 opacity-65">
                A better experience comes from paying attention to what
                matters to the people making the choice.
              </p>
            </div>

            <div>
              {principles.map((principle) => (
                <article
                  key={principle.number}
                  className="grid gap-3 border-t border-base-300 py-7 sm:grid-cols-[60px_1fr] sm:gap-6 sm:py-8"
                >
                  <span className="text-sm font-bold text-gray-500">
                    {principle.number}
                  </span>

                  <div>
                    <h3 className="text-xl font-bold sm:text-2xl">
                      {principle.title}
                    </h3>

                    <p className="mt-3 max-w-xl leading-7 opacity-70">
                      {principle.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Minimal closing section */}
        <section className="border-t border-base-300 bg-base-200">
          <div className="mx-auto flex max-w-7xl flex-col gap-7 px-5 py-14 sm:px-8 sm:py-16 md:flex-row md:items-center md:justify-between lg:px-12">
            <div>
              <p className="text-xs font-bold tracking-[0.25em] text-gray-500">
                THE ROAD AHEAD
              </p>

              <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
                Your next journey starts with a choice.
              </h2>
            </div>

            <Link
              href="/cars"
              className="btn w-fit rounded-full border-gray-500 bg-gray-500 px-7 text-white transition-colors hover:border-gray-700 hover:bg-gray-700"
            >
              Explore Vehicles ↗
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
