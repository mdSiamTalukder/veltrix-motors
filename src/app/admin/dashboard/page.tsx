
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { listContacts } from "@/lib/contacts";
import { getInquiryCounts } from "@/lib/inquiries";
import { getVehicleCounts } from "@/lib/vehicles";
import {
  ContactMessagesSection,
  ContactMessagesStatCard,
} from "@/components/admin/ContactMessages";
import LogoutButton from "@/components/admin/LogoutButton";
import CurrentYear from "@/components/CurrentYear";

export const instant = false;

export default async function AdminDashboardPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const [vehicleCounts, inquiryCounts, contacts] = await Promise.all([
    getVehicleCounts(),
    getInquiryCounts(),
    listContacts(),
  ]);

  const stats = [
    {
      title: "Total Cars",
      value: String(vehicleCounts.total),
      description: "Cars in your inventory",
      icon: "🚘",
      href: "/admin/cars",
    },
    {
      title: "Published Cars",
      value: String(vehicleCounts.published),
      description: "Cars visible on your website",
      icon: "🌐",
      href: "/admin/cars",
    },
    {
      title: "Customer Inquiries",
      value: String(inquiryCounts.total),
      description: "Messages from potential buyers",
      icon: "✉️",
      href: "/admin/inquiries",
    },
  ];

  return (
    <main className="min-h-screen bg-base-200 text-base-content">
      {/* Navbar */}
      <header className="border-b border-base-300 bg-base-100">
        <div className="navbar mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex-1">
            <Link
              href="/admin/dashboard"
              className="text-lg font-bold sm:text-xl"
            >
              <span className="text-primary">Veltrix</span> Motors
              <span className="ml-2 text-xs font-medium opacity-60 sm:text-sm">
                ADMIN
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs opacity-60">Signed in as</p>
              <p className="text-sm font-medium">{session.email}</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:py-12">
        {/* Page heading */}
        <section>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Showroom Management
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Admin Dashboard
          </h1>

          <p className="mt-3 max-w-2xl text-sm opacity-70 sm:text-base">
            Welcome back! Manage your car inventory and keep track of customer
            inquiries and contact messages from one place.
          </p>
        </section>

        {/* Statistics */}
        <section>
          <h2 className="mb-4 text-lg font-semibold">Overview</h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {stats.map((stat) => (
              <Link
                key={stat.title}
                href={stat.href}
                className="card border border-base-300 bg-base-100 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
              >
                <div className="card-body gap-4 p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium opacity-70">
                      {stat.title}
                    </p>
                    <span
                      className="text-2xl"
                      role="img"
                      aria-label={stat.title}
                    >
                      {stat.icon}
                    </span>
                  </div>

                  <p className="text-4xl font-bold">{stat.value}</p>

                  <p className="text-sm opacity-60">{stat.description}</p>
                </div>
              </Link>
            ))}

            <ContactMessagesStatCard initialCount={contacts.length} />
          </div>
        </section>

        {/* Quick actions */}
        <section className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body p-5 sm:p-7">
            <h2 className="card-title text-xl">Quick Actions</h2>

            <p className="text-sm opacity-70">
              Choose what you want to manage today.
            </p>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/admin/cars"
                className="btn btn-primary w-full sm:w-auto"
              >
                <span aria-hidden="true">＋</span>
                Manage Cars
              </Link>

              <Link
                href="/admin/inquiries"
                className="btn btn-outline w-full sm:w-auto"
              >
                <span aria-hidden="true">✉</span>
                View Inquiries
              </Link>

              <Link
                href="/"
                className="btn btn-ghost w-full sm:w-auto"
              >
                Visit Public Website
                <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Contact messages */}
        <ContactMessagesSection initialContacts={contacts} />

        {/* Inventory placeholder */}
        <section className="card border border-dashed border-base-300 bg-base-100">
          <div className="card-body items-center px-5 py-10 text-center sm:py-14">
            <div className="text-4xl" aria-hidden="true">
              🚗
            </div>

            <h2 className="mt-2 text-xl font-bold">
              Your Showroom Workspace
            </h2>

            <p className="max-w-lg text-sm leading-6 opacity-70">
              Manage your inventory and review customer messages. Published
              vehicles and new inquiries are reflected on your public website.
            </p>
          </div>
        </section>

        <footer className="pb-2 text-center text-xs opacity-50">
          © <CurrentYear /> Veltrix Motors · Admin Panel
        </footer>
      </div>
    </main>
  );
}
