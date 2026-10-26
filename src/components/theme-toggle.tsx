"use client";

export default function ThemeToggle() {
  return (
    <label className="swap swap-rotate btn btn-ghost btn-circle" aria-label="Toggle theme">
      <input
        type="checkbox"
        aria-label="Toggle light and dark theme"
        onChange={(event) => {
          document.documentElement.setAttribute(
            "data-theme",
            event.target.checked ? "dark" : "light",
          );
        }}
      />
      <svg
        className="swap-off size-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3l1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3l1.42-1.42" />
      </svg>
      <svg
        className="swap-on size-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M20.9 13A9 9 0 0111 3.1 9 9 0 1020.9 13z" />
      </svg>
    </label>
  );
}
