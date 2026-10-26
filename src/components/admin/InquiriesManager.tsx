"use client";

import { useEffect, useMemo, useState } from "react";
import type { Inquiry } from "@/types";

type StatusFilter = "all" | "new" | "read";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

export default function InquiriesManager() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/inquiries", { signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) {
          throw new Error("unauthorized");
        }
        if (!response.ok) {
          throw new Error("Request failed");
        }
        return response.json();
      })
      .then((data: { inquiries?: Inquiry[] }) => {
        setInquiries(data.inquiries ?? []);
        setLoadError("");
      })
      .catch((error: Error) => {
        if (error.name === "AbortError") return;
        setLoadError("Unable to load inquiries. Please refresh the page.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return inquiries.filter((inquiry) => {
      if (statusFilter !== "all" && inquiry.status !== statusFilter) {
        return false;
      }

      if (query) {
        const haystack =
          `${inquiry.name} ${inquiry.email} ${inquiry.subject} ${inquiry.message} ${inquiry.vehicleName ?? ""}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      return true;
    });
  }, [inquiries, statusFilter, search]);

  const newCount = inquiries.filter(
    (inquiry) => inquiry.status === "new",
  ).length;

  async function setStatus(inquiry: Inquiry, status: Inquiry["status"]) {
    setBusyId(inquiry.id);
    setActionError("");

    try {
      const response = await fetch(`/api/inquiries/${inquiry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      setInquiries((current) =>
        current.map((item) =>
          item.id === inquiry.id ? { ...item, status } : item,
        ),
      );
    } catch {
      setActionError("Unable to update this inquiry. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(inquiry: Inquiry) {
    setBusyId(inquiry.id);
    setActionError("");

    try {
      const response = await fetch(`/api/inquiries/${inquiry.id}`, {
        method: "DELETE",
      });

      if (!response.ok && response.status !== 404) {
        throw new Error("Request failed");
      }

      setInquiries((current) =>
        current.filter((item) => item.id !== inquiry.id),
      );
    } catch {
      setActionError("Unable to delete this inquiry. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="card border border-base-300 bg-base-100">
        <div className="card-body items-center px-5 py-14 text-center">
          <span className="loading loading-spinner loading-lg" />
          <p className="mt-3 text-sm opacity-65">Loading inquiries…</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="card border border-error/40 bg-base-100">
        <div className="card-body items-center px-5 py-14 text-center">
          <h2 className="text-xl font-bold">Unable to load inquiries</h2>
          <p className="max-w-sm text-sm opacity-65">{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body gap-2 p-5">
            <p className="text-sm font-medium opacity-65">Total Inquiries</p>
            <p className="text-3xl font-bold">{inquiries.length}</p>
          </div>
        </div>
        <div className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body gap-2 p-5">
            <p className="text-sm font-medium opacity-65">Unread</p>
            <p className="text-3xl font-bold">{newCount}</p>
          </div>
        </div>
        <div className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body gap-2 p-5">
            <p className="text-sm font-medium opacity-65">Read</p>
            <p className="text-3xl font-bold">{inquiries.length - newCount}</p>
          </div>
        </div>
      </div>

      <div className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body gap-4 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              type="search"
              className="input input-bordered w-full bg-base-100"
              placeholder="Search by name, email, or message..."
              aria-label="Search inquiries"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <div className="join">
              {(["all", "new", "read"] as StatusFilter[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatusFilter(value)}
                  className={`btn join-item ${statusFilter === value ? "btn-primary" : "btn-outline"}`}
                >
                  {value === "all" ? "All" : value === "new" ? "New" : "Read"}
                </button>
              ))}
            </div>
          </div>

          <p className="text-sm opacity-65">
            Showing{" "}
            <span className="font-semibold text-base-content">
              {filtered.length}
            </span>{" "}
            of {inquiries.length} inquiries
          </p>
        </div>
      </div>

      {actionError && (
        <p role="alert" className="alert alert-error text-sm">
          {actionError}
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="card border border-dashed border-base-300 bg-base-100">
          <div className="card-body items-center px-5 py-12 text-center sm:py-16">
            <div className="text-4xl" aria-hidden="true">
              📭
            </div>

            <h2 className="mt-2 text-xl font-bold">
              {inquiries.length === 0
                ? "No inquiries yet"
                : "No matching inquiries"}
            </h2>

            <p className="max-w-lg text-sm leading-6 opacity-70">
              {inquiries.length === 0
                ? "When customers reach out through your website, their messages will appear here."
                : "Try a different search term or status filter."}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {filtered.map((inquiry) => (
            <article
              key={inquiry.id}
              className="card border border-base-300 bg-base-100 shadow-sm"
            >
              <div className="card-body gap-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">{inquiry.name}</h2>
                    <p className="text-xs opacity-60">
                      {formatDate(inquiry.createdAt)}
                    </p>
                  </div>

                  <span
                    className={`badge border-0 ${
                      inquiry.status === "new"
                        ? "badge-primary"
                        : "badge-ghost"
                    }`}
                  >
                    {inquiry.status === "new" ? "New" : "Read"}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="badge badge-outline">
                    {inquiry.subject}
                  </span>
                  {inquiry.vehicleName && (
                    <span className="badge badge-outline badge-primary">
                      {inquiry.vehicleName}
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-sm">
                  <p className="flex flex-wrap gap-x-2">
                    <span className="opacity-60">Email:</span>
                    <a
                      href={`mailto:${inquiry.email}`}
                      className="link link-hover"
                    >
                      {inquiry.email}
                    </a>
                  </p>
                  {inquiry.phone && (
                    <p className="flex flex-wrap gap-x-2">
                      <span className="opacity-60">Phone:</span>
                      <a
                        href={`tel:${inquiry.phone}`}
                        className="link link-hover"
                      >
                        {inquiry.phone}
                      </a>
                    </p>
                  )}
                </div>

                <p className="whitespace-pre-line border-t border-base-300 pt-3 text-sm leading-6 opacity-80">
                  {inquiry.message}
                </p>

                <div className="flex flex-wrap gap-2">
                  {inquiry.status === "new" ? (
                    <button
                      type="button"
                      disabled={busyId === inquiry.id}
                      onClick={() => setStatus(inquiry, "read")}
                      className="btn btn-outline btn-sm"
                    >
                      Mark as read
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busyId === inquiry.id}
                      onClick={() => setStatus(inquiry, "new")}
                      className="btn btn-outline btn-sm"
                    >
                      Mark as new
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={busyId === inquiry.id}
                    onClick={() => remove(inquiry)}
                    className="btn btn-ghost btn-sm text-error"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
