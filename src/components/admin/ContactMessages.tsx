"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import type { ContactSubmission } from "@/types";

const CONTACT_MESSAGES_CHANGED = "veltrix:contact-messages-changed";

type ContactMessagesChangedDetail = {
  total: number;
};

type Feedback = {
  type: "success" | "error";
  message: string;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

export function ContactMessagesStatCard({
  initialCount,
}: {
  initialCount: number;
}) {
  const [total, setTotal] = useState(initialCount);

  useEffect(() => {
    function handleChange(event: Event) {
      const detail = (event as CustomEvent<ContactMessagesChangedDetail>)
        .detail;

      if (detail && typeof detail.total === "number") {
        setTotal(detail.total);
      }
    }

    window.addEventListener(CONTACT_MESSAGES_CHANGED, handleChange);

    return () =>
      window.removeEventListener(CONTACT_MESSAGES_CHANGED, handleChange);
  }, []);

  return (
    <Link
      href="#contact-messages"
      className="card border border-base-300 bg-base-100 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
    >
      <div className="card-body gap-4 p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium opacity-70">Contact Messages</p>
          <span className="text-2xl" role="img" aria-label="Contact Messages">
            📨
          </span>
        </div>

        <p className="text-4xl font-bold">{total}</p>

        <p className="text-sm opacity-60">Messages from the contact form</p>
      </div>
    </Link>
  );
}

export function ContactMessagesSection({
  initialContacts,
}: {
  initialContacts: ContactSubmission[];
}) {
  const [contacts, setContacts] = useState(initialContacts);
  const [pendingDelete, setPendingDelete] =
    useState<ContactSubmission | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  function requestDelete(contact: ContactSubmission) {
    setFeedback(null);
    setPendingDelete(contact);
  }

  function cancelDelete() {
    if (isDeleting) return;
    setPendingDelete(null);
  }

  async function confirmDelete() {
    if (!pendingDelete || isDeleting) return;

    const target = pendingDelete;
    setIsDeleting(true);
    setFeedback(null);

    try {
      const response = await fetch(
        `/api/contact/${encodeURIComponent(target.id)}`,
        { method: "DELETE" },
      );

      if (response.ok || response.status === 404) {
        const next = contacts.filter((contact) => contact.id !== target.id);

        setContacts(next);
        window.dispatchEvent(
          new CustomEvent<ContactMessagesChangedDetail>(
            CONTACT_MESSAGES_CHANGED,
            { detail: { total: next.length } },
          ),
        );
        setPendingDelete(null);
        setFeedback({
          type: "success",
          message:
            response.status === 404
              ? "This message had already been deleted."
              : `Message from ${target.name} was deleted.`,
        });
        return;
      }

      const data = (await response.json().catch(() => null)) as {
        message?: unknown;
      } | null;

      let message =
        data && typeof data.message === "string" && data.message.trim() !== ""
          ? data.message
          : "Unable to delete this message. Please try again.";

      if (response.status === 401) {
        message = "Your session has expired. Please sign in again.";
      }

      setPendingDelete(null);
      setFeedback({ type: "error", message });
    } catch {
      setPendingDelete(null);
      setFeedback({
        type: "error",
        message:
          "Network error. The message was not deleted. Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section id="contact-messages" className="scroll-mt-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Contact Messages</h2>
          <p className="mt-1 text-sm opacity-60">
            Messages submitted through the public contact form.
          </p>
        </div>

        <span className="badge badge-outline">
          {contacts.length} {contacts.length === 1 ? "message" : "messages"}
        </span>
      </div>

      {feedback && (
        <p
          role={feedback.type === "error" ? "alert" : "status"}
          className={`alert ${
            feedback.type === "error" ? "alert-error" : "alert-success"
          } mb-4 text-sm`}
        >
          {feedback.message}
        </p>
      )}

      {contacts.length === 0 ? (
        <div className="card border border-dashed border-base-300 bg-base-100">
          <div className="card-body items-center px-5 py-12 text-center sm:py-16">
            <div className="text-4xl" aria-hidden="true">
              📭
            </div>

            <h3 className="mt-2 text-xl font-bold">
              No contact messages yet
            </h3>

            <p className="max-w-lg text-sm leading-6 opacity-70">
              When visitors send a message through the contact form, it will
              appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {contacts.map((contact) => (
            <article
              key={contact.id}
              className="card border border-base-300 bg-base-100 shadow-sm"
            >
              <div className="card-body gap-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold">{contact.name}</h3>
                    <p className="text-xs opacity-60">
                      {formatDate(contact.createdAt)}
                    </p>
                  </div>

                  {contact.subject && (
                    <span className="badge badge-outline">
                      {contact.subject}
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-sm">
                  <p className="flex flex-wrap gap-x-2">
                    <span className="opacity-60">Email:</span>
                    <a
                      href={`mailto:${contact.email}`}
                      className="link link-hover break-all"
                    >
                      {contact.email}
                    </a>
                  </p>
                  {contact.phone && (
                    <p className="flex flex-wrap gap-x-2">
                      <span className="opacity-60">Phone:</span>
                      <a
                        href={`tel:${contact.phone}`}
                        className="link link-hover"
                      >
                        {contact.phone}
                      </a>
                    </p>
                  )}
                </div>

                <p className="whitespace-pre-line border-t border-base-300 pt-3 text-sm leading-6 opacity-80">
                  {contact.message}
                </p>

                <div className="flex justify-end">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm text-error"
                    onClick={() => requestDelete(contact)}
                    disabled={isDeleting}
                    aria-label={`Delete message from ${contact.name}`}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {pendingDelete && (
        <div
          className="modal modal-open z-[60]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-contact-title"
        >
          <div className="modal-box max-w-md">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-error/10 text-error">
              <Trash2 size={23} />
            </div>

            <h2
              id="delete-contact-title"
              className="mt-4 text-center text-xl font-bold"
            >
              Delete this message?
            </h2>

            <p className="mt-2 text-center text-sm opacity-65">
              This will permanently delete the message from{" "}
              <span className="font-medium">{pendingDelete.name}</span>. This
              action cannot be undone.
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={cancelDelete}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-error"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <Trash2 size={16} />
                )}
                {isDeleting ? "Deleting…" : "Delete Message"}
              </button>
            </div>
          </div>

          <button
            type="button"
            className="modal-backdrop"
            aria-label="Cancel deletion"
            onClick={cancelDelete}
          >
            Close
          </button>
        </div>
      )}
    </section>
  );
}
