import { NextResponse } from "next/server";
import {
  checkRateLimit,
  getClientIp,
  jsonError,
  readJsonBody,
  requireAdmin,
} from "@/lib/api-helpers";
import { createInquiry, listInquiries, parseInquiryInput } from "@/lib/inquiries";
import { DataStoreError } from "@/lib/json-store";
import { getPublishedVehicleById } from "@/lib/vehicles";

export async function POST(request: Request) {
  const ip = getClientIp(request);

  if (!checkRateLimit(`inquiry:${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 })) {
    return jsonError("Too many requests. Please try again later.", 429);
  }

  const body = await readJsonBody(request, 16 * 1024);

  if (!body.ok) {
    return body.response;
  }

  const parsed = parseInquiryInput(body.data);

  if (!parsed.ok) {
    return jsonError("Please correct the highlighted fields.", 400, parsed.errors);
  }

  try {
    if (parsed.value.vehicleId) {
      const vehicle = await getPublishedVehicleById(parsed.value.vehicleId);

      if (vehicle) {
        parsed.value.vehicleName = `${vehicle.brand} ${vehicle.model}`;
      } else {
        parsed.value.vehicleId = null;
      }
    }

    const inquiry = await createInquiry(parsed.value);

    return NextResponse.json(
      {
        message: "Thank you. Your inquiry has been received.",
        inquiry: { id: inquiry.id, createdAt: inquiry.createdAt },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof DataStoreError) {
      return jsonError("Inquiries are temporarily unavailable.", 503);
    }

    console.error("POST /api/inquiries failed:", error);
    return jsonError("Unable to submit your inquiry.", 500);
  }
}

export async function GET(request: Request) {
  const session = await requireAdmin();

  if (!session) {
    return jsonError("Unauthorized.", 401);
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  try {
    const inquiries = await listInquiries({ status, search });

    return NextResponse.json({ inquiries, total: inquiries.length });
  } catch (error) {
    if (error instanceof DataStoreError) {
      return jsonError("Inquiries are temporarily unavailable.", 503);
    }

    console.error("GET /api/inquiries failed:", error);
    return jsonError("Unable to load inquiries.", 500);
  }
}
