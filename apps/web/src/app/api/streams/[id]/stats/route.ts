import { NextRequest, NextResponse } from "next/server";
import { streamManager } from "@/lib/server/stream-manager";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const stats = streamManager.getStreamStats(params.id);
    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
