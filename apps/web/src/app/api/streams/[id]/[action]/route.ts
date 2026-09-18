import { NextRequest, NextResponse } from "next/server";
import { streamManager } from "@/lib/server/stream-manager";
import { requireAuth } from "@/lib/server/session";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id, action } = await params;

  let result = { success: false, message: "Invalid action" };

  if (action === "start") {
    result = await streamManager.startStream(id);
  } else if (action === "stop") {
    result = await streamManager.stopStream(id);
  } else if (action === "restart") {
    result = await streamManager.restartStream(id);
  }

  return NextResponse.json(result);
}
