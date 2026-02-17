import { runChecksForAllProjects } from "@/checks/runner";
import { resolveDisappearedFindings } from "@/notifications/resolver";
import { prisma } from "@/db/prisma";
import { logger } from "@/lib/logger";

/**
 * Runs all monitoring checks for all projects.
 * Designed to be called by a cron scheduler (e.g., every hour).
 * Can also be triggered via POST /api/checks/run
 */
export async function checkRunnerJob(): Promise<void> {
  const start = Date.now();
  logger.info("Check runner job started");

  try {
    const result = await runChecksForAllProjects();

    // Auto-resolve findings that disappeared
    const projects = await prisma.project.findMany({ select: { id: true } });
    let totalResolved = 0;
    for (const project of projects) {
      totalResolved += await resolveDisappearedFindings(project.id);
    }

    const duration = Date.now() - start;
    logger.info("Check runner job completed", {
      ...result,
      totalResolved,
      durationMs: duration,
    });
  } catch (error) {
    logger.error("Check runner job failed", {
      error: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - start,
    });
  }
}
