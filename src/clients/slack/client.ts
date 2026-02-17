import { WebClient } from "@slack/web-api";
import { logger } from "@/lib/logger";

let client: WebClient | null = null;

export function getSlackClient(): WebClient | null {
  if (client) return client;
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    logger.warn("SLACK_BOT_TOKEN not configured");
    return null;
  }
  client = new WebClient(token);
  return client;
}

export async function sendSlackMessage(channel: string, text: string): Promise<boolean> {
  const slack = getSlackClient();
  if (!slack) {
    // Fallback to webhook
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) return false;

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, text }),
    });
    return res.ok;
  }

  await slack.chat.postMessage({ channel, text });
  return true;
}
