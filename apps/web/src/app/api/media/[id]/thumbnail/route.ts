import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/session";
import fs from "fs";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const cleanId = id.replace(/[^a-zA-Z0-9_-]/g, "");
    const thumbFilePath = path.join(process.cwd(), "uploads", "thumbnails", `${cleanId}.jpg`);

    if (!fs.existsSync(thumbFilePath)) {
      return new NextResponse("Thumbnail not found", { status: 404 });
    }

    const fileBuffer = fs.readFileSync(thumbFilePath);
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err: any) {
    return new NextResponse(err.message, { status: 500 });
  }
}
