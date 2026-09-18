import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
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
    const mediaList = db.getMedia();
    const media = mediaList.find((m) => m.id === id);
    if (!media || !media.filepath || !fs.existsSync(media.filepath)) {
      return new NextResponse("File not found", { status: 404 });
    }

    const stat = fs.statSync(media.filepath);
    const fileSize = stat.size;
    const range = req.headers.get("range");

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const fileStream = fs.createReadStream(media.filepath, { start, end });

      const headers = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize.toString(),
        "Content-Type": "video/mp4",
      };

      return new NextResponse(fileStream as any, { status: 206, headers });
    } else {
      const headers = {
        "Content-Length": fileSize.toString(),
        "Content-Type": "video/mp4",
      };
      const fileStream = fs.createReadStream(media.filepath);
      return new NextResponse(fileStream as any, { status: 200, headers });
    }
  } catch (err: any) {
    return new NextResponse(err.message, { status: 500 });
  }
}
