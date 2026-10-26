import { neon } from "@neondatabase/serverless";
import { readFile } from "node:fs/promises";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL missing from .env.local");
}

const sql = neon(process.env.DATABASE_URL);

async function loadJson(filename) {
  const url = new URL(`../data/${filename}`, import.meta.url);
  return JSON.parse(await readFile(url, "utf8"));
}

const vehicles = await loadJson("vehicles.json");
const contacts = await loadJson("contacts.json");
const inquiries = await loadJson("inquiries.json");

for (const v of vehicles) {
  await sql`
    INSERT INTO vehicles (
      id, brand, model, category, year, price, mileage,
      transmission, fuel, condition, status, published,
      featured, image, images, created_at, updated_at
    ) VALUES (
      ${v.id}, ${v.brand}, ${v.model}, ${v.category},
      ${v.year}, ${v.price}, ${v.mileage}, ${v.transmission},
      ${v.fuel}, ${v.condition}, ${v.status}, ${v.published},
      ${v.featured}, ${v.image}, ${JSON.stringify(v.images ?? [])}::jsonb,
      ${v.createdAt}, ${v.updatedAt}
    )
    ON CONFLICT (id) DO NOTHING
  `;
}

for (const c of contacts) {
  await sql`
    INSERT INTO contacts (
      id, name, email, phone, subject, message, status, created_at
    ) VALUES (
      ${c.id}, ${c.name}, ${c.email}, ${c.phone},
      ${c.subject}, ${c.message}, ${c.status}, ${c.createdAt}
    )
    ON CONFLICT (id) DO NOTHING
  `;
}

for (const i of inquiries) {
  await sql`
    INSERT INTO inquiries (
      id, name, email, phone, subject, message,
      vehicle_id, vehicle_name, status, created_at
    ) VALUES (
      ${i.id}, ${i.name}, ${i.email}, ${i.phone},
      ${i.subject}, ${i.message}, ${i.vehicleId ?? null},
      ${i.vehicleName ?? null}, ${i.status}, ${i.createdAt}
    )
    ON CONFLICT (id) DO NOTHING
  `;
}

const result = await sql`
  SELECT
    (SELECT COUNT(*)::int FROM vehicles) AS vehicles,
    (SELECT COUNT(*)::int FROM contacts) AS contacts,
    (SELECT COUNT(*)::int FROM inquiries) AS inquiries
`;

console.log("Migration complete:", result[0]);
