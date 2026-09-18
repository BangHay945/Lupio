import { NextRequest, NextResponse } from "next/server";
import { destroySession } from "@/lib/server/session";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("lupio_session")?.value;

  if (token) {
    destroySession(token);
  }

  const res = NextResponse.json({ success: true });

  // Clear the cookie
  res.cookies.set("lupio_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });

  return res;
}
