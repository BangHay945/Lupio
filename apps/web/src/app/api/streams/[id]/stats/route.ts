import { NextRequest, NextResponse } from "next/server";
import { streamManager } from "@/lib/server/stream-manager";
import { requireAuth } from "@/lib/server/session";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const params = await props.params;
    const stats = streamManager.getStreamStats(params.id);
    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
