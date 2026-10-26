import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-base-300 bg-base-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <Link href="/" className="text-lg font-black tracking-tight">
          VELTRIX <span className="text-primary">MOTORS</span>
        </Link>

        <p className="text-sm opacity-60">
          © Veltrix Motors. All rights reserved.
        </p>

        <div className="flex gap-5 text-sm opacity-70">
          <Link href="#home" className="hover:text-primary">
            Home
          </Link>
          <Link href="/cars" className="hover:text-primary">
            Our Cars
          </Link>
          <Link href="#contact" className="hover:text-primary">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
