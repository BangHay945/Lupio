import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { MediaItem } from "@/lib/mock-data";
import { probeMedia } from "@/lib/server/media-probe";
import { requireAuth } from "@/lib/server/session";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";

export const dynamic = "force-dynamic";
export const maxDuration = 1800; // 30 minutes for large file uploads

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const media = db.getMedia();
  return NextResponse.json(media);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    ensureUploadsDir();

    const contentType = req.headers.get("content-type") || "";
    let filename = "";
    let filePath = "";
    let fileSize = 0;

    const ALLOWED_EXTENSIONS = new Set([
      ".mp4", ".mkv", ".mov", ".webm", ".avi", ".ts", ".flv", ".mp3", ".m4a", ".aac", ".wav"
    ]);

    // 1. Direct Binary Stream Upload (Handles huge files like 500MB - 50GB without memory limits)
    if (!contentType.includes("multipart/form-data")) {
      const headerFilename = req.headers.get("x-filename");
      const queryFilename = req.nextUrl.searchParams.get("filename");
      const rawName = headerFilename || queryFilename;
      filename = rawName ? decodeURIComponent(rawName) : `media_${Date.now()}.mp4`;

      const ext = path.extname(filename).toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        return NextResponse.json(
          { error: `Format file "${ext}" tidak didukung. Hanya file video/audio (.mp4, .mkv, .mov, .webm, dll.) yang diizinkan.` },
          { status: 400 }
        );
      }

      if (!req.body) {
        return NextResponse.json({ error: "No stream body provided" }, { status: 400 });
      }

      const safeFilename = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
      filePath = path.join(UPLOADS_DIR, safeFilename);

      const nodeStream = Readable.fromWeb(req.body as any);
      const writeStream = fs.createWriteStream(filePath);
      await pipeline(nodeStream, writeStream);

      const stats = fs.statSync(filePath);
      fileSize = stats.size;
    } else {
      // 2. Multipart/form-data Fallback
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      filename = file.name;
      const ext = path.extname(filename).toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        return NextResponse.json(
          { error: `Format file "${ext}" tidak didukung. Hanya file video/audio (.mp4, .mkv, .mov, .webm, dll.) yang diizinkan.` },
          { status: 400 }
        );
      }

      const safeFilename = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
      filePath = path.join(UPLOADS_DIR, safeFilename);

      const nodeStream = Readable.fromWeb(file.stream() as any);
      const writeStream = fs.createWriteStream(filePath);
      await pipeline(nodeStream, writeStream);

      fileSize = file.size;
    }

    const sizeFormatted = fileSize >= 1024 * 1024 * 1024
      ? (fileSize / (1024 * 1024 * 1024)).toFixed(2) + " GB"
      : (fileSize / (1024 * 1024)).toFixed(1) + " MB";
    const mediaId = `med_${Date.now()}`;

    // Extract real metadata (duration, resolution) & generate thumbnail with FFmpeg
    const probe = await probeMedia(filePath, mediaId);

    const newItem: MediaItem = {
      id: mediaId,
      filename: filename,
      duration: probe.duration || "00:00:00",
      resolution: probe.resolution || "1080p",
      thumbnail: probe.thumbnail,
      size: sizeFormatted,
      filepath: filePath,
      type: "video",
      uploadDate: new Date().toISOString().split("T")[0],
    };

    const mediaList = db.getMedia();
    mediaList.unshift(newItem);
    db.saveMedia(mediaList);

    db.addLog("info", "media", `Uploaded new media file "${filename}" (${sizeFormatted}, ${newItem.duration}, ${newItem.resolution})`);
    return NextResponse.json(newItem, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/media error]:", err);
    return NextResponse.json({ error: err.message || "Failed to process upload" }, { status: 500 });
  }
}
