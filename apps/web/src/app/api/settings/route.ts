import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

export async function GET() {
  return NextResponse.json(db.getSettings());
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const updated = db.updateSettings(body);
    db.addLog("info", "system", "Updated system settings.");
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
