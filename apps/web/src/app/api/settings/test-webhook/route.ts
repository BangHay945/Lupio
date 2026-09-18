import { NextRequest, NextResponse } from "next/server";
import { sendStreamNotification } from "@/lib/server/webhook";
import { db } from "@/lib/server/db";
import { requireAuth } from "@/lib/server/session";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const settings = db.getSettings();
    if (!settings.enableWebhooks) {
      return NextResponse.json(
        { success: false, message: "Webhooks are disabled in settings." },
        { status: 400 }
      );
    }

    if (!settings.telegramBotToken && !settings.discordWebhookUrl) {
      return NextResponse.json(
        { success: false, message: "No Telegram Bot Token or Discord Webhook URL is configured." },
        { status: 400 }
      );
    }

    await sendStreamNotification(
      "START",
      "Test Notification Node",
      "YouTube Live (Verification Test)",
      "✅ Connection Test successful! Telegram / Discord webhook integration is working properly."
    );

    return NextResponse.json({
      success: true,
      message: "Test webhook alert dispatched successfully.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
