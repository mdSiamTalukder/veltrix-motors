import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import InquiriesManager from "@/components/admin/InquiriesManager";
import { getAdminSession } from "@/lib/admin-auth";

export const instant = false;

export default async function AdminInquiriesPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <main className="min-h-screen bg-base-200 text-base-content">
      <header className="border-b border-base-300 bg-base-100">
        <div className="navbar mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex-1">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2 text-sm opacity-70 transition hover:text-primary hover:opacity-100"
            >
              <ArrowLeft size={18} />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Dashboard</span>
            </Link>
          </div>

          <Link href="/admin/dashboard" className="text-lg font-bold sm:text-xl">
            <span className="text-primary">Veltrix</span> Motors
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-7 px-4 py-7 sm:px-6 sm:py-10">
        <section>
          <div className="breadcrumbs mb-2 text-sm opacity-60">
            <ul>
              <li>
                <Link href="/admin/dashboard">Admin</Link>
              </li>
              <li>Inquiries</li>
            </ul>
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Customer Inquiries
          </h1>

          <p className="mt-2 text-sm opacity-65 sm:text-base">
            Review, update, and manage messages from potential buyers.
          </p>
        </section>

        <InquiriesManager />

        <footer className="pb-3 pt-2 text-center text-xs opacity-50">
          Veltrix Motors · Admin Inquiries
        </footer>
      </div>
    </main>
  );
}
