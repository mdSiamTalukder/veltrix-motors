import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing.");
}

const sql = neon(process.env.DATABASE_URL);

await sql`
  CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    category TEXT NOT NULL,
    year INTEGER NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    mileage DOUBLE PRECISION NOT NULL,
    transmission TEXT NOT NULL,
    fuel TEXT NOT NULL,
    condition TEXT NOT NULL CHECK (condition IN ('New', 'Used')),
    status TEXT NOT NULL CHECK (status IN ('Available', 'Reserved', 'Sold')),
    published BOOLEAN NOT NULL DEFAULT TRUE,
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    image TEXT NOT NULL,
    images JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new'
      CHECK (status IN ('new', 'read')),
    created_at TIMESTAMPTZ NOT NULL
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS inquiries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    vehicle_id TEXT,
    vehicle_name TEXT,
    status TEXT NOT NULL DEFAULT 'new'
      CHECK (status IN ('new', 'read')),
    created_at TIMESTAMPTZ NOT NULL
  )
`;

await sql`
  CREATE INDEX IF NOT EXISTS contacts_created_at_idx
  ON contacts (created_at DESC)
`;

await sql`
  CREATE INDEX IF NOT EXISTS inquiries_created_at_idx
  ON inquiries (created_at DESC)
`;

await sql`
  CREATE INDEX IF NOT EXISTS vehicles_published_idx
  ON vehicles (published)
`;

console.log("Database schema created or already exists.");

const tables = await sql`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('vehicles', 'contacts', 'inquiries')
  ORDER BY table_name
`;

console.log("Verified tables:", tables.map((row) => row.table_name));
