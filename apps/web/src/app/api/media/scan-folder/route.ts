import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { MediaItem } from "@/lib/mock-data";
import { probeMedia } from "@/lib/server/media-probe";
import { requireAuth } from "@/lib/server/session";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

const VIDEO_EXTENSIONS = new Set([
  ".mp4",
  ".mkv",
  ".mov",
  ".avi",
  ".ts",
  ".flv",
  ".webm",
  ".m4v",
]);

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      return NextResponse.json({
        success: true,
        scannedCount: 0,
        addedCount: 0,
        addedItems: [],
        message: "Uploads folder was empty.",
      });
    }

    const allDiskEntries = fs.readdirSync(UPLOADS_DIR, { withFileTypes: true });
    const existingMedia = db.getMedia();
    const existingFilenames = new Set(existingMedia.map((m) => m.filename.toLowerCase()));

    // Filter only video files that are not directories and not yet in database
    const newVideoFiles = allDiskEntries.filter((entry) => {
      if (!entry.isFile()) return false;
      const ext = path.extname(entry.name).toLowerCase();
      if (!VIDEO_EXTENSIONS.has(ext)) return false;
      if (existingFilenames.has(entry.name.toLowerCase())) return false;
      return true;
    });

    const currentMedia = db.getMedia();
    const addedItems: MediaItem[] = [];

    for (const entry of newVideoFiles) {
      try {
        const filePath = path.join(UPLOADS_DIR, entry.name);
        const stats = fs.statSync(filePath);
        const sizeFormatted = stats.size >= 1024 * 1024 * 1024
          ? (stats.size / (1024 * 1024 * 1024)).toFixed(2) + " GB"
          : (stats.size / (1024 * 1024)).toFixed(1) + " MB";
        const mediaId = `med_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

        // Extract metadata and generate thumbnail
        const probe = await probeMedia(filePath, mediaId);

        const newItem: MediaItem = {
          id: mediaId,
          filename: entry.name,
          duration: probe.duration || "00:00:00",
          resolution: probe.resolution || "1080p",
          thumbnail: probe.thumbnail,
          size: sizeFormatted,
          filepath: filePath,
          type: "video",
          uploadDate: new Date().toISOString().split("T")[0],
        };

        currentMedia.unshift(newItem);
        addedItems.push(newItem);

        db.addLog(
          "info",
          "media",
          `[SFTP/Scan] Registered new media file "${entry.name}" (${sizeFormatted}, ${probe.duration}, ${probe.resolution})`
        );
      } catch (err: any) {
        console.error(`Error processing scanned file ${entry.name}:`, err);
      }
    }

    if (addedItems.length > 0) {
      db.saveMedia(currentMedia);
    }

    return NextResponse.json({
      success: true,
      scannedCount: allDiskEntries.filter((e) => e.isFile()).length,
      addedCount: addedItems.length,
      addedItems,
      message:
        addedItems.length > 0
          ? `Found and registered ${addedItems.length} new media file(s).`
          : "No new video files found in server uploads directory.",
    });
  } catch (error: any) {
    console.error("[api/media/scan-folder]", error);
    return NextResponse.json(
      { error: error.message || "Failed to scan folder" },
      { status: 500 }
    );
  }
}
