import { sendDailyDigest } from "@/notifications/digest";
import { logger } from "@/lib/logger";

/**
 * Sends the daily digest summary to Slack.
 * Designed to be called by a cron scheduler (e.g., every day at 08:00).
 */
export async function digestJob(): Promise<void> {
  logger.info("Digest job started");
  try {
    await sendDailyDigest();
    logger.info("Digest job completed");
  } catch (error) {
    logger.error("Digest job failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
