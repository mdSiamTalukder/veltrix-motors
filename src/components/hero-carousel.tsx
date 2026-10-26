/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Slide = {
  src: string;
  alt: string;
  label: string;
};

const slides: Slide[] = [
  {
    src: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=88",
    alt: "Black Porsche 911 sports car parked on an open coastal road",
    label: "Porsche 911",
  },
  {
    src: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1600&q=88",
    alt: "Silver BMW 5 Series executive sedan photographed in a modern driveway",
    label: "BMW 5 Series",
  },
  {
    src: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1600&q=88",
    alt: "White Mercedes-Benz C-Class luxury sedan with a sleek front profile",
    label: "Mercedes-Benz C-Class",
  },
];

const AUTOPLAY_MS = 5500;

export default function HeroCarousel() {
  const [active, setActive] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isInteracting, setIsInteracting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const resumeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const count = slides.length;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    return () => {
      if (resumeRef.current) clearTimeout(resumeRef.current);
    };
  }, []);

  const pauseThenResume = useCallback(() => {
    setIsPlaying(false);
    if (resumeRef.current) clearTimeout(resumeRef.current);
    resumeRef.current = setTimeout(() => setIsPlaying(true), AUTOPLAY_MS);
  }, []);

  const select = useCallback(
    (index: number) => {
      setActive(index);
      pauseThenResume();
    },
    [pauseThenResume],
  );

  const prev = useCallback(() => {
    setActive((current) => (current - 1 + count) % count);
    pauseThenResume();
  }, [count, pauseThenResume]);

  const next = useCallback(() => {
    setActive((current) => (current + 1) % count);
    pauseThenResume();
  }, [count, pauseThenResume]);

  const autoplayEnabled = isPlaying && !isInteracting && !reducedMotion;

  useEffect(() => {
    if (!autoplayEnabled) return;
    const id = setInterval(() => {
      setActive((current) => (current + 1) % count);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [autoplayEnabled, count]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      prev();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      next();
    }
  };

  return (
    <div
      className="relative w-full outline-none"
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured luxury cars"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsInteracting(true)}
      onMouseLeave={() => setIsInteracting(false)}
      onFocusCapture={() => setIsInteracting(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsInteracting(false);
        }
      }}
    >
      <div className="relative aspect-[16/11] w-full overflow-hidden rounded-3xl border border-base-300 bg-base-200 shadow-2xl shadow-base-content/10 sm:aspect-[16/9] lg:aspect-[4/3]">
        {slides.map((slide, index) => (
          <div
            key={slide.src}
            aria-hidden={index !== active}
            className={`absolute inset-0 transition-opacity duration-700 ease-out motion-reduce:transition-none ${
              index === active ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <img
              src={slide.src}
              alt={slide.alt}
              draggable={false}
              loading={index === 0 ? "eager" : "lazy"}
              className="size-full object-cover object-center"
            />
          </div>
        ))}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 sm:p-6">
          <div className="max-w-[19rem] rounded-2xl border border-white/20 bg-black/35 p-4 text-white backdrop-blur-md sm:p-5">
            <p className="text-[10px] font-semibold tracking-[0.2em] text-primary sm:text-xs">
              THE VELTRIX EXPERIENCE
            </p>
            <p className="mt-2 text-base font-bold sm:mt-3 sm:text-lg">
              Find the car that feels like you.
            </p>
            <p className="mt-1 text-xs leading-5 text-white/70 sm:mt-2 sm:text-sm sm:leading-6">
              A considered collection. A more personal buying experience.
            </p>
          </div>
          <span className="hidden shrink-0 rounded-full border border-white/25 bg-black/40 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md sm:inline-flex">
            {slides[active].label}
          </span>
        </div>

        <button
          type="button"
          onClick={prev}
          aria-label="Show previous car"
          className="btn btn-circle btn-sm absolute left-3 top-1/2 -translate-y-1/2 border border-base-300/60 bg-base-100/75 text-base-content backdrop-blur-md hover:bg-base-100 sm:left-4"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="size-4"
            aria-hidden="true"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <button
          type="button"
          onClick={next}
          aria-label="Show next car"
          className="btn btn-circle btn-sm absolute right-3 top-1/2 -translate-y-1/2 border border-base-300/60 bg-base-100/75 text-base-content backdrop-blur-md hover:bg-base-100 sm:right-4"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="size-4"
            aria-hidden="true"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <div className="mt-4 flex items-center justify-center gap-3">
        <div className="flex items-center gap-2">
          {slides.map((slide, index) => (
            <button
              key={slide.src}
              type="button"
              onClick={() => select(index)}
              aria-label={`Go to slide ${index + 1}: ${slide.label}`}
              aria-current={index === active ? "true" : undefined}
              className={`h-2 rounded-full transition-all duration-300 motion-reduce:transition-none ${
                index === active
                  ? "w-7 bg-primary"
                  : "w-2 bg-base-content/25 hover:bg-base-content/45"
              }`}
            />
          ))}
        </div>

        <span aria-hidden="true" className="mx-1 h-4 w-px bg-base-content/20" />

        <button
          type="button"
          onClick={() => setIsPlaying((playing) => !playing)}
          aria-label={isPlaying ? "Pause automatic sliding" : "Resume automatic sliding"}
          className="btn btn-circle btn-xs border border-base-300 bg-base-100 text-base-content hover:bg-base-200"
        >
          {isPlaying ? (
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-3"
              aria-hidden="true"
            >
              <path d="M7 5h3v14H7zM14 5h3v14h-3z" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-3"
              aria-hidden="true"
            >
              <path d="M8 5l11 7-11 7z" />
            </svg>
          )}
        </button>
      </div>

      <p className="sr-only" aria-live="polite">
        {`Slide ${active + 1} of ${count}: ${slides[active].label}`}
      </p>
    </div>
  );
}
