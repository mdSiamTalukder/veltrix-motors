
"use client";

import Link from "next/link";
import { useState, type ChangeEvent, type FormEvent } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type ContactForm = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  company: string;
};

const initialForm: ContactForm = {
  name: "",
  email: "",
  phone: "",
  subject: "General inquiry",
  message: "",
  company: "",
};

export default function ContactPage() {
  const [form, setForm] = useState<ContactForm>(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function handleChange(
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = event.target;

    setForm((previous) => ({ ...previous, [name]: value }));
    setSubmitted(false);
    setErrorMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    setFieldErrors({});

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = (await response.json()) as {
        message?: string;
        fields?: Record<string, string>;
      };

      if (!response.ok) {
        setFieldErrors(data.fields ?? {});
        setErrorMessage(data.message ?? "Unable to send your message.");
        return;
      }

      setSubmitted(true);
    } catch {
      setErrorMessage("Unable to send your message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-base-100 text-base-content">
        {/* Page heading */}
        <section className="border-b border-base-300">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500 sm:text-sm">
              Contact Veltrix Motors
            </p>

            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Let&apos;s find the right car for you.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-base-content/65 sm:text-lg sm:leading-8">
              Have a question or need help with your next vehicle? Send us a
              message. We&apos;re here to make your car-buying journey simpler.
            </p>
          </div>
        </section>

        {/* Main contact area */}
        <section className="mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:px-8 sm:py-16 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20 lg:px-12 lg:py-20">
          {/* Contact information */}
          <aside className="lg:pt-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              Get in touch
            </h2>

            <p className="mt-3 max-w-md text-sm leading-7 text-base-content/65 sm:text-base">
              Tell us what you&apos;re looking for, and we&apos;ll help you
              explore your options.
            </p>

            <div className="mt-9 divide-y divide-base-300 border-y border-base-300">
              <div className="py-5">
                <div className="flex items-start gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-base-200 text-base-content">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      className="size-5"
                    >
                      <path
                        d="M4 5.5h16v13H4z"
                        strokeLinejoin="round"
                      />
                      <path d="m4.5 6 7.5 6 7.5-6" />
                    </svg>
                  </span>

                  <div>
                    <h3 className="font-medium">Send an inquiry</h3>
                    <p className="mt-1 text-sm leading-6 text-base-content/60">
                      Use the contact form to tell us how we can help.
                    </p>
                  </div>
                </div>
              </div>

              <div className="py-5">
                <div className="flex items-start gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-base-200 text-base-content">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      className="size-5"
                    >
                      <path
                        d="M12 21s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12Z"
                        strokeLinejoin="round"
                      />
                      <circle cx="12" cy="9" r="2.3" />
                    </svg>
                  </span>

                  <div>
                    <h3 className="font-medium">Explore our collection</h3>
                    <p className="mt-1 text-sm leading-6 text-base-content/60">
                      Browse the vehicles available in our showroom.
                    </p>
                    <Link
                      href="/cars"
                      className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition-colors hover:text-base-content"
                    >
                      View available cars <span aria-hidden="true">↗</span>
                    </Link>
                  </div>
                </div>
              </div>

              <div className="py-5">
                <div className="flex items-start gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-base-200 text-base-content">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      className="size-5"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
                    </svg>
                  </span>

                  <div>
                    <h3 className="font-medium">Learn about us</h3>
                    <p className="mt-1 text-sm leading-6 text-base-content/60">
                      Get to know the Veltrix Motors approach.
                    </p>
                    <Link
                      href="/about"
                      className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition-colors hover:text-base-content"
                    >
                      About Veltrix Motors <span aria-hidden="true">↗</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-6 text-xs leading-6 text-base-content/50">
              We aim to make every step of finding your next vehicle clear and
              straightforward.
            </p>
          </aside>

          {/* Contact form */}
          <div className="h-fit rounded-2xl border border-base-300 bg-base-100 p-5 sm:p-8 lg:p-9">
            <div className="border-b border-base-300 pb-6">
              <h2 className="text-2xl font-semibold tracking-tight">
                Send us a message
              </h2>
              <p className="mt-2 text-sm leading-6 text-base-content/60">
                Complete the details below and tell us what you need.
              </p>
            </div>

            {submitted ? (
              <div className="py-10" role="status" aria-live="polite">
                <div className="flex size-12 items-center justify-center rounded-full bg-base-200 text-xl">
                  ✓
                </div>

                <h3 className="mt-5 text-xl font-semibold">
                  Thank you for reaching out.
                </h3>

                <p className="mt-2 max-w-md text-sm leading-7 text-base-content/65">
                  Your message has been received. Our team will get back to you
                  using the details you provided.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setForm(initialForm);
                    setSubmitted(false);
                  }}
                  className="btn btn-outline mt-6 rounded-full"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 pt-6">
                <div className="grid gap-5 sm:grid-cols-2">
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
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
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
                      What can we help with?
                    </span>
                    <select
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      className="select select-bordered w-full bg-base-100"
                    >
                      <option>General inquiry</option>
                      <option>Vehicle information</option>
                      <option>Book a test drive</option>
                      <option>Buying assistance</option>
                      <option>Other</option>
                    </select>
                  </label>
                </div>

                <label className="form-control w-full">
                  <span className="label-text mb-2 font-medium">
                    Your message <span className="text-gray-500">*</span>
                  </span>
                  <textarea
                    name="message"
                    placeholder="Tell us a little about what you're looking for..."
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="textarea textarea-bordered min-h-36 w-full resize-y bg-base-100 leading-7"
                  />
                  {fieldErrors.message && (
                    <span className="mt-1 text-xs text-error">
                      {fieldErrors.message}
                    </span>
                  )}
                </label>

                <label className="hidden" aria-hidden="true">
                  Company
                  <input
                    name="company"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.company}
                    onChange={handleChange}
                  />
                </label>

                {errorMessage && (
                  <p role="alert" className="alert alert-error text-sm">
                    {errorMessage}
                  </p>
                )}

                <div className="flex flex-col gap-4 border-t border-base-300 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-xs text-xs leading-5 text-base-content/50">
                    Fields marked with * are required.
                  </p>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn rounded-full bg-gray-500 px-7 text-white hover:bg-gray-600"
                  >
                    {submitting ? (
                      "Sending…"
                    ) : (
                      <>
                        Submit inquiry <span aria-hidden="true">↗</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs leading-5 text-base-content/50">
                  We&apos;ll only use your details to respond to your inquiry.
                </p>
              </form>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
