import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

export async function GET() {
  return NextResponse.json(db.getPlaylists());
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newPlaylist = {
      id: body.id || `pl_${Date.now()}`,
      name: body.name || "Untitled Playlist",
      itemCount: body.itemCount || 0,
      totalDuration: body.totalDuration || "00:00",
      createdAt: body.createdAt || new Date().toISOString().split("T")[0],
      mediaItems: body.mediaItems || [],
    };
    db.savePlaylist(newPlaylist);
    db.addLog("info", "playlist", `Saved playlist "${newPlaylist.name}"`);
    return NextResponse.json(newPlaylist, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
