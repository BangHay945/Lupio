import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getFfmpegPath } from "@/lib/server/media-probe";
import { requireAuth } from "@/lib/server/session";
import { spawn } from "child_process";
import fs from "fs";

export const dynamic = "force-dynamic";

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

    const ffmpegPath = getFfmpegPath();
    const startSec = req.nextUrl.searchParams.get("start") || "0";

    const args = [
      "-ss", startSec,
      "-i", media.filepath,
      "-vf", "scale='min(1280,iw)':-2",
      "-c:v", "libx264",
      "-preset", "ultrafast",
      "-tune", "zerolatency",
      "-crf", "26",
      "-c:a", "aac",
      "-b:a", "128k",
      "-f", "mp4",
      "-movflags", "frag_keyframe+empty_moov+default_base_moof",
      "pipe:1",
    ];

    const child = spawn(ffmpegPath, args, {
      stdio: ["ignore", "pipe", "ignore"],
    });

    const stream = new ReadableStream({
      start(controller) {
        child.stdout.on("data", (chunk: Buffer) => {
          controller.enqueue(
            new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength)
          );
        });
        child.stdout.on("end", () => {
          try {
            controller.close();
          } catch {}
        });
        child.on("error", (err) => {
          try {
            controller.error(err);
          } catch {}
        });
      },
      cancel() {
        try {
          child.kill("SIGKILL");
        } catch {}
      },
    });

    return new NextResponse(stream as any, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err: any) {
    return new NextResponse(err.message, { status: 500 });
  }
}
