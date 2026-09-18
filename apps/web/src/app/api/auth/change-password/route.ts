import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/server/db";
import { getSession } from "@/lib/server/session";

/**
 * POST /api/auth/change-password
 * Body: { currentPassword: string, newPassword: string }
 */
export async function POST(req: NextRequest) {
  // Auth guard
  const token = req.cookies.get("lupio_session")?.value ?? "";
  const session = getSession(token);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Both currentPassword and newPassword are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password baru minimal 8 karakter." },
        { status: 400 }
      );
    }

    const settings = db.getSettings();
    const adminPasswordHash: string | undefined = (settings as any).adminPasswordHash;

    let currentValid = false;

    if (adminPasswordHash) {
      currentValid = await bcrypt.compare(currentPassword, adminPasswordHash);
    } else {
      // First time: no hash yet, accept "admin123" as default
      currentValid = currentPassword === "admin123";
    }

    if (!currentValid) {
      return NextResponse.json(
        { error: "Password saat ini salah." },
        { status: 403 }
      );
    }

    // Hash new password
    const newHash = await bcrypt.hash(newPassword, 12);
    db.updateSettings({ adminPasswordHash: newHash } as any);
    db.addLog("info", "security", `Admin password changed for ${session.email}`);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[auth/change-password]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
