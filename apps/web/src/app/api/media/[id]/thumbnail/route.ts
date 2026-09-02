import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const thumbFilePath = path.join(process.cwd(), "uploads", "thumbnails", `${id}.jpg`);

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
