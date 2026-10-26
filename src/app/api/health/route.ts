import { NextResponse, connection } from "next/server";
import { ensureStorageDirs } from "@/lib/storage-paths";

export async function GET() {
  await connection();

  try {
    await ensureStorageDirs();
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json({ status: "unavailable" }, { status: 503 });
  }
}
