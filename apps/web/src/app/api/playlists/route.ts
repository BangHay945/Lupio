import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { parseDurationToSeconds, formatSecondsToDuration } from "@/lib/server/media-probe";
import { MediaItem } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json(db.getPlaylists());
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const mediaItems: MediaItem[] = body.mediaItems || [];

    // Calculate real total duration from media items
    let totalSec = 0;
    for (const item of mediaItems) {
      totalSec += parseDurationToSeconds(item.duration || "00:00:00");
    }
    const computedDuration = formatSecondsToDuration(totalSec);

    const newPlaylist = {
      id: body.id || `pl_${Date.now()}`,
      name: body.name || "Untitled Playlist",
      itemCount: mediaItems.length,
      totalDuration: body.totalDuration && body.totalDuration !== "00:00" ? body.totalDuration : computedDuration,
      createdAt: body.createdAt || new Date().toISOString().split("T")[0],
      mediaItems,
      transitionEffect: body.transitionEffect || "none",
    };
    db.savePlaylist(newPlaylist);
    db.addLog("info", "playlist", `Saved playlist "${newPlaylist.name}" (${newPlaylist.itemCount} items, ${newPlaylist.totalDuration})`);
    return NextResponse.json(newPlaylist, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

