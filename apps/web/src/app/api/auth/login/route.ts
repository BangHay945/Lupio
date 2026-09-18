import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/server/db";
import { createSession } from "@/lib/server/session";

const DEFAULT_EMAIL = "admin@lupio.local";
const DEFAULT_PASSWORD = "admin123";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi." },
        { status: 400 }
      );
    }

    const settings = db.getSettings();

    // adminEmail: use what's stored in DB, or fallback to default
    const adminEmail: string =
      (settings as any).adminEmail?.trim() || DEFAULT_EMAIL;
    const adminPasswordHash: string | undefined =
      (settings as any).adminPasswordHash;

    // Case-insensitive email comparison
    if (email.trim().toLowerCase() !== adminEmail.toLowerCase()) {
      return NextResponse.json(
        { error: "Email atau password salah." },
        { status: 401 }
      );
    }

    let passwordValid = false;

    if (adminPasswordHash) {
      // Verify against stored bcrypt hash
      passwordValid = await bcrypt.compare(password, adminPasswordHash);
    } else {
      // First-time: no hash stored yet — accept default password and immediately hash it
      if (password === DEFAULT_PASSWORD) {
        passwordValid = true;
        const hash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
        db.updateSettings({ adminPasswordHash: hash } as any);
      }
    }

    if (!passwordValid) {
      return NextResponse.json(
        { error: "Email atau password salah." },
        { status: 401 }
      );
    }

    // Look up user role
    const users = db.getUsers();
    const matchedUser = users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );
    const userRole = (matchedUser?.role as "Admin" | "Operator") || "Admin";

    // Create cryptographic session token with role
    const token = createSession(adminEmail, userRole);

    const res = NextResponse.json({ success: true });
    res.cookies.set("lupio_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 24h
      path: "/",
    });

    return res;
  } catch (err: any) {
    console.error("[auth/login]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/login — returns the configured admin email
 * so the login page can show a hint to the user.
 */
export async function GET() {
  try {
    const settings = db.getSettings();
    const adminEmail =
      (settings as any).adminEmail?.trim() || DEFAULT_EMAIL;
    return NextResponse.json({ adminEmail });
  } catch {
    return NextResponse.json({ adminEmail: DEFAULT_EMAIL });
  }
}
