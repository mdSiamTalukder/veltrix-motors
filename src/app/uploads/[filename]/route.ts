import { connection } from "next/server";
import { readUploadedImage } from "@/lib/image-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  await connection();

  const { filename } = await params;
  const image = await readUploadedImage(filename);

  if (!image) {
    return new Response("Image not found.", { status: 404 });
  }

  return new Response(new Uint8Array(image.buffer), {
    status: 200,
    headers: {
      "Content-Type": image.type,
      "Content-Length": String(image.buffer.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    },
  });
}
