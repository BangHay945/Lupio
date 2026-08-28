import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

export async function GET() {
  const rules = db.getScheduleRules();
  return NextResponse.json(rules);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const saved = db.saveScheduleRule(body);
    db.addLog("info", "scheduler", `Saved time-based playlist rule "${saved.playlistName}" (${saved.startTime}-${saved.endTime})`);
    return NextResponse.json(saved);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save rule" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing rule id" }, { status: 400 });
    db.deleteScheduleRule(id);
    db.addLog("info", "scheduler", `Deleted time-based schedule rule ID ${id}`);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete rule" }, { status: 500 });
  }
}
