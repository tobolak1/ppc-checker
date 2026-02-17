import { WebClient } from "@slack/web-api";
import { CheckFinding } from "@/checks/types";
import { db, T } from "@/db";
import type { Finding } from "@/db/types";
import { logger } from "@/lib/logger";

const slack = process.env.SLACK_WEBHOOK_URL
  ? new WebClient(process.env.SLACK_BOT_TOKEN)
  : null;

const SEVERITY_EMOJI: Record<string, string> = {
  CRITICAL: ":rotating_light:",
  HIGH: ":warning:",
  MEDIUM: ":large_yellow_circle:",
  LOW: ":information_source:",
  INFO: ":speech_balloon:",
};

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: "#dc2626",
  HIGH: "#ea580c",
  MEDIUM: "#ca8a04",
  LOW: "#2563eb",
  INFO: "#6b7280",
};

interface AlertPayload {
  projectName: string;
  finding: CheckFinding;
}

// Cooldown tracking: checkId -> last sent timestamp
const cooldownMap = new Map<string, number>();

function isInQuietHours(): boolean {
  const quietStart = parseInt(process.env.NOTIFY_QUIET_HOURS_START ?? "22");
  const quietEnd = parseInt(process.env.NOTIFY_QUIET_HOURS_END ?? "7");
  const hour = new Date().getHours();
  if (quietStart > quietEnd) {
    return hour >= quietStart || hour < quietEnd;
  }
  return hour >= quietStart && hour < quietEnd;
}

function isInCooldown(checkId: string): boolean {
  const cooldownMin = parseInt(process.env.NOTIFY_COOLDOWN_MIN ?? "60");
  const lastSent = cooldownMap.get(checkId);
  if (!lastSent) return false;
  return (Date.now() - lastSent) < cooldownMin * 60 * 1000;
}

export async function sendAlert(payload: AlertPayload): Promise<void> {
  const { projectName, finding } = payload;
  const isCritical = finding.severity === "CRITICAL";

  // CRITICAL bypasses quiet hours and cooldown
  if (!isCritical) {
    if (isInQuietHours()) {
      logger.info("Alert suppressed (quiet hours)", { checkId: finding.checkId });
      return;
    }
    if (isInCooldown(finding.checkId)) {
      logger.info("Alert suppressed (cooldown)", { checkId: finding.checkId });
      return;
    }
  }

  const channel = isCritical
    ? (process.env.SLACK_CHANNEL_CRITICAL ?? "#ppc-alerts-critical")
    : (process.env.SLACK_CHANNEL_DEFAULT ?? "#ppc-alerts");

  const minSeverityOrder = ["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"];
  const minSeverity = process.env.NOTIFY_MIN_SEVERITY ?? "MEDIUM";
  if (minSeverityOrder.indexOf(finding.severity) < minSeverityOrder.indexOf(minSeverity)) {
    return;
  }

  // Send via webhook if no bot token
  if (!slack && process.env.SLACK_WEBHOOK_URL) {
    await sendWebhook(process.env.SLACK_WEBHOOK_URL, projectName, finding, channel);
  } else if (slack) {
    await slack.chat.postMessage({
      channel,
      text: `${SEVERITY_EMOJI[finding.severity]} ${finding.severity} | ${projectName}`,
      attachments: [
        {
          color: SEVERITY_COLOR[finding.severity],
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*${finding.checkId}*: ${finding.title}\n${finding.message}`,
              },
            },
          ],
        },
      ],
    });
  } else {
    logger.warn("No Slack configuration found, alert not sent", { checkId: finding.checkId });
    return;
  }

  cooldownMap.set(finding.checkId, Date.now());

  // Persist alert in DB
  try {
    const { data: dbFinding } = await db
      .from(T.findings)
      .select("id")
      .eq("check_id", finding.checkId)
      .is("resolved_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single<Pick<Finding, "id">>();

    if (dbFinding) {
      await db.from(T.alerts).insert({
        finding_id: dbFinding.id,
        channel,
        status: "ACTIVE",
      });
    }
  } catch (err) {
    logger.error("Failed to persist alert", { error: (err as Error).message });
  }
}

async function sendWebhook(
  url: string,
  projectName: string,
  finding: CheckFinding,
  channel: string,
): Promise<void> {
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      channel,
      text: `${SEVERITY_EMOJI[finding.severity]} ${finding.severity} | ${projectName}\n*${finding.checkId}*: ${finding.title}\n${finding.message}`,
    }),
  });
}

export async function resolveAlerts(checkId: string): Promise<number> {
  // Find active alerts for resolved findings with this checkId
  const { data: resolvedFindings } = await db
    .from(T.findings)
    .select("id")
    .eq("check_id", checkId)
    .not("resolved_at", "is", null);

  if (!resolvedFindings?.length) return 0;

  const findingIds = resolvedFindings.map((f) => f.id);
  const now = new Date().toISOString();

  const { count } = await db
    .from(T.alerts)
    .update({ status: "RESOLVED", resolved_at: now })
    .eq("status", "ACTIVE")
    .in("finding_id", findingIds);

  const resolved = count ?? 0;

  if (resolved > 0 && slack) {
    const channel = process.env.SLACK_CHANNEL_DEFAULT ?? "#ppc-alerts";
    await slack.chat.postMessage({
      channel,
      text: `:white_check_mark: Resolved: *${checkId}* — ${resolved} alert(s) resolved.`,
    });
  }

  return resolved;
}
