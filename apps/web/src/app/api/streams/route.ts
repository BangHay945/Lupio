import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { streamManager } from "@/lib/server/stream-manager";
import { requireAuth } from "@/lib/server/session";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const streams = db.getStreams();
  return NextResponse.json(streams);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const newStream = {
      id: `str_${Date.now()}`,
      name: body.name || "New Stream",
      status: body.scheduleType === "now" ? ("STARTING" as const) : ("SCHEDULED" as const),
      channelName: body.channelName || "YouTube Live",
      channelId: body.channelId,
      playlistName: body.playlistName || "Default Playlist",
      playlistId: body.playlistId,
      resolution: body.resolution || "1080p",
      fps: parseInt(body.fps) || 30,
      bitrate: `${body.videoBitrate || body.bitrate || 8000} Kbps`,
      uptime: "0m",
      restartCount: 0,
      currentVideo: "Initializing...",
      transitionEffect: body.transitionEffect || "none",
      multiChannelIds: body.multiChannelIds,
      watermarkText: body.watermarkText,
      tickerText: body.tickerText,
      backupMediaId: body.backupMediaId,
      logoWatermarkPath: body.logoWatermarkPath,
      logoPosition: body.logoPosition,
      enableDigitalClock: Boolean(body.enableDigitalClock),
      clockPosition: body.clockPosition,
      clockTimezone: body.clockTimezone || "Asia/Jakarta",
      clockShowLabel: body.clockShowLabel !== false,
    };

    db.saveStream(newStream);
    db.addLog("info", "system", `Created stream "${newStream.name}"`);

    if (body.scheduleType === "now") {
      streamManager.startStream(newStream.id);
    }

    return NextResponse.json(newStream, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
