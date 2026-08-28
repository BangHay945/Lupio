import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

export async function GET() {
  const keys = db.getApiKeys();
  return NextResponse.json(keys);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newKey = db.createApiKey(body.name || "External Automation Key");
    db.addLog("info", "security", `Generated new REST API Key "${newKey.name}" (${newKey.key.substring(0, 14)}...)`);
    return NextResponse.json(newKey);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create API key" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing key id" }, { status: 400 });
    db.deleteApiKey(id);
    db.addLog("info", "security", `Revoked API Key ID ${id}`);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete API key" }, { status: 500 });
  }
}
