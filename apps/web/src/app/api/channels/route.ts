import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { requireAuth } from "@/lib/server/session";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json(db.getChannels());
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const newChannel = {
      id: body.id || `ch_${Date.now()}`,
      name: body.name || "YouTube Live Channel",
      platform: body.platform || "YouTube",
      rtmpUrl: body.rtmpUrl || "rtmp://a.rtmp.youtube.com/live2",
      streamKey: body.streamKey || "••••••••••••",
      status: body.status || "Active",
      isDefault: body.isDefault || false,
    };
    db.saveChannel(newChannel);
    db.addLog("info", "channel", `Saved channel "${newChannel.name}"`);
    return NextResponse.json(newChannel, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
