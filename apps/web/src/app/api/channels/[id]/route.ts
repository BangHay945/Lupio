import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const existing = db.getChannels().find((c) => c.id === id);
    const updated = { ...existing, ...body, id };
    db.saveChannel(updated);
    db.addLog("info", "system", `Updated channel "${updated.name}"`);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  db.deleteChannel(id);
  return NextResponse.json({ success: true });
}
