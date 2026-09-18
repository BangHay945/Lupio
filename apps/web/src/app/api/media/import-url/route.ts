import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { MediaItem } from "@/lib/mock-data";
import { probeMedia } from "@/lib/server/media-probe";
import { requireAuth } from "@/lib/server/session";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

const ALLOWED_EXTENSIONS = new Set([
  ".mp4", ".mkv", ".mov", ".webm", ".avi", ".ts", ".flv", ".mp3", ".m4a", ".aac", ".wav"
]);

function extractFilenameFromHeader(headerValue: string | null): string | null {
  if (!headerValue) return null;
  // Match filename*="utf-8''filename.ext" or filename="filename.ext"
  const utf8Match = headerValue.match(/filename\*=utf-8''([^;\s]+)/i);
  if (utf8Match) return decodeURIComponent(utf8Match[1].replace(/["']/g, ""));
  const standardMatch = headerValue.match(/filename="?([^";\n]+)"?/i);
  if (standardMatch) return standardMatch[1].trim();
  return null;
}

function normalizeDownloadUrl(inputUrl: string): { url: string; isGoogleDrive: boolean; fileId?: string } {
  const trimmed = inputUrl.trim();

  // Check Dropbox
  if (trimmed.includes("dropbox.com")) {
    const urlObj = new URL(trimmed);
    urlObj.searchParams.set("dl", "1");
    return { url: urlObj.toString(), isGoogleDrive: false };
  }

  // Check Google Drive
  const driveRegex = /(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|docs\.google\.com\/file\/d\/)([a-zA-Z0-9_-]+)/i;
  const match = trimmed.match(driveRegex);
  if (match) {
    const fileId = match[1];
    return {
      url: `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`,
      isGoogleDrive: true,
      fileId,
    };
  }

  return { url: trimmed, isGoogleDrive: false };
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    ensureUploadsDir();

    const body = await req.json();
    const rawUrl = body.url;
    const customFilename = body.filename?.trim();

    if (!rawUrl || typeof rawUrl !== "string") {
      return NextResponse.json({ error: "A valid URL is required" }, { status: 400 });
    }

    const { url: directUrl, isGoogleDrive, fileId } = normalizeDownloadUrl(rawUrl);

    // Initial fetch
    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };

    let response = await fetch(directUrl, {
      headers,
      redirect: "follow",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Download failed with HTTP status ${response.status}: ${response.statusText}` },
        { status: 400 }
      );
    }

    // Handle Google Drive large file virus confirmation page
    const contentType = response.headers.get("content-type") || "";
    if (isGoogleDrive && contentType.includes("text/html")) {
      const htmlText = await response.text();
      // Look for confirm token
      const confirmMatch =
        htmlText.match(/confirm=([0-9a-zA-Z_]+)/i) ||
        htmlText.match(/name="confirm"\s+value="([0-9a-zA-Z_]+)"/i);

      if (confirmMatch && fileId) {
        const confirmToken = confirmMatch[1];
        const secondUrl = `https://drive.google.com/uc?export=download&confirm=${confirmToken}&id=${fileId}`;
        
        // Pass cookies if any
        const setCookie = response.headers.get("set-cookie");
        if (setCookie) {
          headers["Cookie"] = setCookie.split(";")[0];
        }

        response = await fetch(secondUrl, {
          headers,
          redirect: "follow",
        });
      } else {
        return NextResponse.json(
          {
            error:
              "Could not access Google Drive file. Ensure the file sharing setting is set to 'Anyone with the link can view' (Public).",
          },
          { status: 400 }
        );
      }
    }

    if (!response.body) {
      return NextResponse.json({ error: "Received empty response from server" }, { status: 400 });
    }

    // Determine filename
    let derivedName = customFilename || "";
    if (!derivedName) {
      const cdHeader = response.headers.get("content-disposition");
      const fromHeader = extractFilenameFromHeader(cdHeader);
      if (fromHeader) {
        derivedName = fromHeader;
      } else {
        try {
          const parsed = new URL(rawUrl);
          const pathname = parsed.pathname;
          const base = path.basename(pathname);
          if (base && base.includes(".")) {
            derivedName = decodeURIComponent(base);
          }
        } catch {
          // ignore
        }
      }
    }

    if (!derivedName) {
      derivedName = `cloud_import_${Date.now()}.mp4`;
    }

    // Ensure extension
    let ext = path.extname(derivedName).toLowerCase();
    if (!ext) {
      ext = ".mp4";
      derivedName += ext;
    }

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        {
          error: `Unsupported file extension "${ext}". Only video/audio files (${Array.from(
            ALLOWED_EXTENSIONS
          ).join(", ")}) are allowed.`,
        },
        { status: 400 }
      );
    }

    const safeFilename = `${Date.now()}_${derivedName.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
    const filePath = path.join(UPLOADS_DIR, safeFilename);

    // Stream download directly to file
    const fileStream = fs.createWriteStream(filePath);
    const nodeStream = Readable.fromWeb(response.body as any);
    await pipeline(nodeStream, fileStream);

    // Verify file exists and has size
    const stat = fs.statSync(filePath);
    if (stat.size === 0) {
      fs.unlinkSync(filePath);
      return NextResponse.json({ error: "Downloaded file is empty (0 bytes)" }, { status: 400 });
    }

    // Check if the file is accidentally HTML (e.g. error page)
    const headerBuffer = Buffer.alloc(512);
    const fd = fs.openSync(filePath, "r");
    fs.readSync(fd, headerBuffer, 0, 512, 0);
    fs.closeSync(fd);
    const headerString = headerBuffer.toString("utf-8").toLowerCase();
    if (
      headerString.includes("<!doctype html") ||
      headerString.includes("<html") ||
      headerString.includes("<head")
    ) {
      fs.unlinkSync(filePath);
      return NextResponse.json(
        {
          error:
            "The URL returned an HTML webpage instead of a video stream. Please check that the URL is a direct media link or a publicly accessible Google Drive file.",
        },
        { status: 400 }
      );
    }

    const sizeInMB = (stat.size / (1024 * 1024)).toFixed(1) + " MB";
    const mediaId = `med_${Date.now()}`;

    // Probe metadata & generate thumbnail
    const probe = await probeMedia(filePath, mediaId);

    const newItem: MediaItem = {
      id: mediaId,
      filename: derivedName,
      duration: probe.duration || "00:00:00",
      resolution: probe.resolution || "1080p",
      thumbnail: probe.thumbnail,
      size: sizeInMB,
      filepath: filePath,
      type: "video",
      uploadDate: new Date().toISOString().split("T")[0],
    };

    const mediaList = db.getMedia();
    mediaList.unshift(newItem);
    db.saveMedia(mediaList);

    db.addLog(
      "info",
      "media",
      `Imported cloud media from URL "${derivedName}" (${sizeInMB}, ${newItem.duration}, ${newItem.resolution})`
    );

    return NextResponse.json(newItem, { status: 201 });
  } catch (err: any) {
    console.error("Cloud media import error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to download and import media from URL" },
      { status: 500 }
    );
  }
}
