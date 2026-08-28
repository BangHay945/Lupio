import { db } from "./db";

export async function sendStreamNotification(
  event: "START" | "STOP" | "RECONNECT" | "ERROR",
  streamName: string,
  channelInfo: string,
  details?: string
) {
  try {
    const settings = db.getSettings();
    if (!settings.enableWebhooks) return;

    const timestamp = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
    const emojiMap = {
      START: "🟢 [STARTED]",
      STOP: "⏹️ [STOPPED]",
      RECONNECT: "🔄 [RECONNECTING]",
      ERROR: "🚨 [ERROR]",
    };

    const title = `${emojiMap[event]} Stream Event: ${streamName}`;
    const textBody = `📡 Stream: *${streamName}*\n📺 Destination: *${channelInfo}*\n⏰ Time: ${timestamp}${details ? `\n📝 Info: ${details}` : ""}`;

    // 1. Send to Telegram if configured
    if (settings.telegramBotToken && settings.telegramChatId) {
      try {
        const url = `https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`;
        await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: settings.telegramChatId,
            text: `${title}\n\n${textBody}`,
            parse_mode: "Markdown",
          }),
        });
        db.addLog("info", "webhook", `Telegram alert sent for stream: ${streamName}`);
      } catch (tgErr: any) {
        db.addLog("warn", "webhook", `Failed to send Telegram alert: ${tgErr.message}`);
      }
    }

    // 2. Send to Discord Webhook if configured
    if (settings.discordWebhookUrl) {
      try {
        const colorMap = {
          START: 3066993, // Green
          STOP: 9807270, // Gray
          RECONNECT: 16763904, // Orange
          ERROR: 15158332, // Red
        };

        await fetch(settings.discordWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "Lupio Broadcaster Bot",
            avatar_url: "https://cdn-icons-png.flaticon.com/512/3204/3204052.png",
            embeds: [
              {
                title,
                description: textBody,
                color: colorMap[event],
                footer: { text: `Node: ${settings.serverName || "Lupio Node 1"}` },
                timestamp: new Date().toISOString(),
              },
            ],
          }),
        });
        db.addLog("info", "webhook", `Discord alert sent for stream: ${streamName}`);
      } catch (dcErr: any) {
        db.addLog("warn", "webhook", `Failed to send Discord alert: ${dcErr.message}`);
      }
    }
  } catch (err: any) {
    console.error("Webhook notification error:", err);
  }
}
