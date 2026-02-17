import { db, T } from "@/db";
import type { Severity, Finding } from "@/db/types";
import { logger } from "@/lib/logger";

interface DigestEntry {
  severity: Severity;
  checkId: string;
  title: string;
  count: number;
}

export async function buildDailyDigest(): Promise<{
  totalActive: number;
  bySeverity: Record<string, number>;
  entries: DigestEntry[];
  resolvedLast24h: number;
}> {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [activeRes, resolvedRes] = await Promise.all([
    db.from(T.findings).select("check_id, severity, title").is("resolved_at", null),
    db.from(T.findings).select("id", { count: "exact", head: true }).gte("resolved_at", yesterday),
  ]);

  const activeFindings = (activeRes.data ?? []) as Pick<Finding, "check_id" | "severity" | "title">[];
  const resolvedCount = resolvedRes.count ?? 0;

  // Group by check_id
  const grouped = new Map<string, { severity: Severity; title: string; count: number }>();
  for (const f of activeFindings) {
    const existing = grouped.get(f.check_id);
    if (existing) {
      existing.count++;
    } else {
      grouped.set(f.check_id, { severity: f.severity, title: f.title, count: 1 });
    }
  }

  const entries: DigestEntry[] = [...grouped.entries()]
    .map(([checkId, data]) => ({ checkId, ...data }))
    .sort((a, b) => {
      const order: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
      return (order[a.severity] ?? 5) - (order[b.severity] ?? 5);
    });

  const bySeverity: Record<string, number> = {};
  for (const f of activeFindings) {
    bySeverity[f.severity] = (bySeverity[f.severity] ?? 0) + 1;
  }

  return {
    totalActive: activeFindings.length,
    bySeverity,
    entries,
    resolvedLast24h: resolvedCount,
  };
}

export async function sendDailyDigest(): Promise<void> {
  if (process.env.NOTIFY_DIGEST_ENABLED !== "true") return;

  const digest = await buildDailyDigest();
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    logger.warn("No SLACK_WEBHOOK_URL configured for digest");
    return;
  }

  const channel = process.env.SLACK_CHANNEL_DEFAULT ?? "#ppc-alerts";

  const severityLine = Object.entries(digest.bySeverity)
    .map(([s, c]) => `${s}: ${c}`)
    .join(" | ");

  const findingsText = digest.entries.length === 0
    ? "_No active findings. All clear!_ :tada:"
    : digest.entries
        .slice(0, 20)
        .map((e) => `• *[${e.severity}]* \`${e.checkId}\` — ${e.title} (${e.count}x)`)
        .join("\n");

  const text = [
    `:newspaper: *Daily PPC Digest* — ${new Date().toLocaleDateString("cs-CZ")}`,
    `Active findings: *${digest.totalActive}* | Resolved (24h): *${digest.resolvedLast24h}*`,
    severityLine ? `Breakdown: ${severityLine}` : "",
    "",
    findingsText,
  ].filter(Boolean).join("\n");

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channel, text }),
  });

  logger.info("Daily digest sent", { totalActive: digest.totalActive });
}
