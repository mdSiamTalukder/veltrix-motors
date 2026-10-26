"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CurrentYear from "@/components/CurrentYear";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Invalid email or password.");
        return;
      }

      router.replace("/admin/dashboard");
      router.refresh();
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-base-200 px-4 py-10 text-base-content sm:px-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-base-300 bg-base-100 shadow-xl lg:grid-cols-2">
        <section className="hidden flex-col justify-between bg-neutral p-10 text-neutral-content lg:flex xl:p-14">
          <Link href="/" className="text-xl font-bold tracking-tight">
            VELTRIX <span className="text-primary">MOTORS</span>
          </Link>

          <div className="py-12">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-neutral-content/60">
              Admin portal
            </p>

            <h1 className="max-w-sm text-4xl font-semibold leading-tight xl:text-5xl">
              Your showroom. Your business. One dashboard.
            </h1>

            <p className="mt-5 max-w-sm text-sm leading-7 text-neutral-content/70">
              Manage your vehicle inventory and customer inquiries from one
              place.
            </p>
          </div>

          <p className="text-sm text-neutral-content/50">
            © <CurrentYear /> Veltrix Motors
          </p>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12 xl:p-14">
          <div className="w-full max-w-md">
            <Link
              href="/"
              className="mb-10 inline-block text-lg font-bold tracking-tight lg:hidden"
            >
              VELTRIX <span className="text-primary">MOTORS</span>
            </Link>

            <div className="mb-8">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                Secure admin access
              </p>

              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Welcome back
              </h2>

              <p className="mt-3 text-sm leading-6 text-base-content/60">
                Sign in to access your showroom dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="form-control">
                <label htmlFor="email" className="label">
                  <span className="label-text font-medium">Email address</span>
                </label>

                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  placeholder="Enter your email"
                  className="input input-bordered h-12 w-full bg-base-100"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div className="form-control">
                <label htmlFor="password" className="label">
                  <span className="label-text font-medium">Password</span>
                </label>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="input input-bordered h-12 w-full bg-base-100 pr-16"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute inset-y-0 right-3 my-auto text-sm font-medium text-base-content/60 hover:text-base-content"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {error && (
                <div role="alert" className="alert alert-error text-sm">
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary h-12 w-full text-base font-semibold"
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    Signing in...
                  </>
                ) : (
                  "Sign in to Dashboard"
                )}
              </button>
            </form>

            <div className="divider my-7 text-xs text-base-content/40">
              ADMINISTRATOR ONLY
            </div>

            <p className="text-center text-sm text-base-content/60">
              Return to the public website{" "}
              <Link href="/" className="font-semibold text-primary hover:underline">
                Visit website
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
