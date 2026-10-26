"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};
const getClientYear = () => new Date().getFullYear();
const getServerYear = () => 2026;

export default function CurrentYear() {
  const year = useSyncExternalStore(
    emptySubscribe,
    getClientYear,
    getServerYear,
  );

  return <>{year}</>;
}
