import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "lupio-stream",
    timestamp: new Date().toISOString(),
  });
}
