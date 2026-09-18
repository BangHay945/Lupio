import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { requireAuth, requireAdmin } from "@/lib/server/session";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const users = db.getUsers();
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const user = db.saveUser(body);
    db.addLog("info", "users", `Saved user account "${user.email}" (${user.role})`);
    return NextResponse.json(user);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save user" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing user id" }, { status: 400 });
    db.deleteUser(id);
    db.addLog("info", "users", `Deleted user account ID ${id}`);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete user" }, { status: 500 });
  }
}
