import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { requireAuth } from "@/lib/server/session";
import fs from "fs";
import path from "path";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const mediaList = db.getMedia();
  const item = mediaList.find((m) => m.id === id);

  if (item && item.filepath && fs.existsSync(item.filepath)) {
    try {
      fs.unlinkSync(item.filepath);
    } catch (e) {
      console.error("Failed to delete media file from disk:", e);
    }
  }

  // Delete thumbnail file if present
  const thumbPath = path.join(process.cwd(), "uploads", "thumbnails", `${id}.jpg`);
  if (fs.existsSync(thumbPath)) {
    try {
      fs.unlinkSync(thumbPath);
    } catch (e) {
      // ignore
    }
  }

  db.deleteMedia(id);
  db.addLog("info", "media", `Deleted media item ${id}`);

  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await req.json();
  const mediaList = db.getMedia();
  const index = mediaList.findIndex((m) => m.id === id);

  if (index === -1) {
    return NextResponse.json({ error: "Media not found" }, { status: 404 });
  }

  mediaList[index] = {
    ...mediaList[index],
    ...body,
  };

  db.saveMedia(mediaList);
  db.addLog("info", "media", `Updated metadata for media item "${mediaList[index].filename}"`);

  return NextResponse.json(mediaList[index]);
}
