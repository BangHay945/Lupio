import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; file?: string[] }> }
) {
  try {
    const { id, file } = await params;
    const cleanId = id.replace(/[^a-zA-Z0-9_-]/g, "");
    const requestedFile = file && file.length > 0 ? file.join("/") : "index.m3u8";

    // Prevent path traversal
    const safeFile = requestedFile.replace(/[^a-zA-Z0-9_.-]/g, "");
    const filePath = path.join(process.cwd(), "data", "hls", cleanId, safeFile);

    if (!fs.existsSync(filePath)) {
      return new NextResponse("Preview segment not found", { status: 404 });
    }

    const ext = path.extname(safeFile).toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === ".m3u8") {
      contentType = "application/vnd.apple.mpegurl";
    } else if (ext === ".ts") {
      contentType = "video/MP2T";
    }

    const fileBuffer = fs.readFileSync(filePath);
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    return new NextResponse(err.message, { status: 500 });
  }
}
