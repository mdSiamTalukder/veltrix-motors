"use client";

import Link from "next/link";
import { useTheme } from "@/components/theme";

export default function Navbar() {
  const { darkMode, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b border-base-300/70 bg-base-100/95 backdrop-blur-xl">
      <div className="navbar mx-auto min-h-20 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="navbar-start">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-content">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="size-7"
                aria-hidden="true"
              >
                <path d="M3 14l2-5a3 3 0 013-2h8a3 3 0 013 2l2 5" />
                <path d="M3 14h18v5h-3v-2H6v2H3z" />
                <path d="M6 14l2-3h8l2 3" />
              </svg>
            </span>
            <span>
              <span className="block text-lg font-black tracking-tight">
                VELTRIX
              </span>
              <span className="block text-[10px] font-semibold tracking-[0.3em] opacity-60">
                MOTORS
              </span>
            </span>
          </Link>
        </div>

        <div className="navbar-center hidden lg:flex">
          <nav className="flex items-center gap-8 text-sm font-medium">
            <Link href="/" className="hover:text-primary">
              Home
            </Link>
            <Link href="/cars" className="hover:text-primary">
              Our Cars
            </Link>
            <Link href="/about" className="hover:text-primary">
              About Us
            </Link>
            <Link href="/contact" className="hover:text-primary">
              Contact
            </Link>
          </nav>
        </div>

        <div className="navbar-end gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="btn btn-ghost btn-circle"
            aria-label="Toggle light and dark theme"
            title="Toggle theme"
          >
            {darkMode ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="size-5"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3l1.42 1.42M2 12h2m16 0h2" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="size-5"
                aria-hidden="true"
              >
                <path d="M20.9 13A9 9 0 0111 3.1 9 9 0 1020.9 13z" />
              </svg>
            )}
          </button>

          <Link
            href="/cars"
            className={`btn rounded-full border transition-colors duration-300 ${
              darkMode
                ? "border-white bg-black text-white hover:bg-white hover:text-black"
                : "border-black bg-white text-black hover:bg-black hover:text-white"
            }`}
          >
            Explore Car ↗
          </Link>

          <div className="dropdown dropdown-end lg:hidden">
            <button
              type="button"
              tabIndex={0}
              className="btn btn-ghost btn-square"
              aria-label="Open navigation menu"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="size-6"
                aria-hidden="true"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <ul
              tabIndex={0}
              className="menu dropdown-content z-50 mt-3 w-52 rounded-box border border-base-300 bg-base-100 p-3 shadow-xl"
            >
              <li>
                <Link href="/">Home</Link>
              </li>
              <li>
                <Link href="/cars">Our Cars</Link>
              </li>
              <li>
                <Link href="/about">About Us</Link>
              </li>
              <li>
                <Link href="/contact">Contact</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
}
