import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

export async function GET() {
  return NextResponse.json(db.getLogs());
}

export async function DELETE() {
  db.clearLogs();
  return NextResponse.json({ success: true });
}
