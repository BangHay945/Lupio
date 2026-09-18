import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { streamManager } from "@/lib/server/stream-manager";
import { requireAuth } from "@/lib/server/session";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const stream = db.getStreamById(id);
  if (!stream) {
    return NextResponse.json({ error: "Stream not found" }, { status: 404 });
  }
  return NextResponse.json(stream);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await req.json();
    const existing = db.getStreamById(id);
    if (!existing) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }
    const updated = { ...existing, ...body, id };
    db.saveStream(updated);
    db.addLog("info", "system", `Updated stream settings for "${updated.name}"`);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  streamManager.stopStream(id);
  db.deleteStream(id);
  return NextResponse.json({ success: true });
}
