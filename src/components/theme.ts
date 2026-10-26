"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "veltrix-theme";
const listeners = new Set<() => void>();

let current = false;
let started = false;

function read() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return saved === "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function apply(dark: boolean) {
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  current = read();
  apply(current);
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return current;
}

function getServerSnapshot() {
  return false;
}

export function useTheme() {
  const darkMode = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  function toggleTheme() {
    current = !current;
    apply(current);
    localStorage.setItem(STORAGE_KEY, current ? "dark" : "light");
    listeners.forEach((listener) => listener());
  }

  return { darkMode, toggleTheme };
}
