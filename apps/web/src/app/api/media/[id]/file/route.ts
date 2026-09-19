import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { requireAuth } from "@/lib/server/session";
import fs from "fs";
import path from "path";
import { Readable } from "stream";

export const dynamic = "force-dynamic";

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".mp4":
    case ".m4v":
      return "video/mp4";
    case ".webm":
      return "video/webm";
    case ".mov":
      return "video/quicktime";
    case ".mkv":
      return "video/x-matroska";
    case ".ts":
      return "video/mp2t";
    case ".avi":
      return "video/x-msvideo";
    case ".mp3":
      return "audio/mpeg";
    case ".aac":
      return "audio/aac";
    case ".wav":
      return "audio/wav";
    default:
      return "video/mp4";
  }
}

function streamFile(filePath: string, options?: { start?: number; end?: number }): any {
  const nodeStream = fs.createReadStream(filePath, options);
  return Readable.toWeb(nodeStream);
}

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
    const contentType = getMimeType(media.filepath);
    const isDownload = req.nextUrl.searchParams.get("download") === "1";
    const disposition = isDownload
      ? `attachment; filename="${encodeURIComponent(media.filename)}"`
      : `inline; filename="${encodeURIComponent(media.filename)}"`;

    const range = req.headers.get("range");

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      let end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (isNaN(start) || start >= fileSize) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            "Content-Range": `bytes */${fileSize}`,
          },
        });
      }

      if (end >= fileSize) {
        end = fileSize - 1;
      }

      const chunksize = end - start + 1;
      const stream = streamFile(media.filepath, { start, end });

      const headers = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize.toString(),
        "Content-Type": contentType,
        "Content-Disposition": disposition,
      };

      return new NextResponse(stream as any, { status: 206, headers });
    } else {
      const headers = {
        "Content-Length": fileSize.toString(),
        "Content-Type": contentType,
        "Accept-Ranges": "bytes",
        "Content-Disposition": disposition,
      };
      const stream = streamFile(media.filepath);
      return new NextResponse(stream as any, { status: 200, headers });
    }
  } catch (err: any) {
    return new NextResponse(err.message, { status: 500 });
  }
}
