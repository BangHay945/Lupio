import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  db.deletePlaylist(id);
  return NextResponse.json({ success: true });
}
