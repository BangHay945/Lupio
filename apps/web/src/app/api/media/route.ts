import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { MediaItem } from "@/lib/mock-data";
import fs from "fs";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

export async function GET() {
  const media = db.getMedia();
  return NextResponse.json(media);
}

export async function POST(req: Request) {
  try {
    ensureUploadsDir();
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const filename = file.name;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const safeFilename = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
    const filePath = path.join(UPLOADS_DIR, safeFilename);

    fs.writeFileSync(filePath, buffer);

    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1) + " MB";

    const newItem: MediaItem = {
      id: `med_${Date.now()}`,
      filename: filename,
      duration: "03:45",
      resolution: "1080p",
      size: sizeInMB,
      filepath: filePath,
      type: "video",
      uploadDate: new Date().toISOString().split("T")[0],
    };

    const mediaList = db.getMedia();
    mediaList.unshift(newItem);
    db.saveMedia(mediaList);

    db.addLog("info", "media", `Uploaded new media file "${filename}" (${sizeInMB})`);
    return NextResponse.json(newItem, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
