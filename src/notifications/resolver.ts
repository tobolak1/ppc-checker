import { prisma } from "@/db/prisma";
import { logger } from "@/lib/logger";

/**
 * Resolves findings that no longer appear in the latest check run.
 * Call this after a successful check run to auto-resolve disappeared issues.
 */
export async function resolveDisappearedFindings(projectId: string): Promise<number> {
  // Get the last two completed check runs for this project
  const lastRuns = await prisma.checkRun.findMany({
    where: { projectId, status: "completed" },
    orderBy: { startedAt: "desc" },
    take: 2,
    select: { id: true },
  });

  if (lastRuns.length < 2) return 0;

  const [latestRun, previousRun] = lastRuns;

  // Get check IDs from both runs
  const [latestFindings, previousFindings] = await Promise.all([
    prisma.finding.findMany({
      where: { checkRunId: latestRun.id },
      select: { checkId: true },
    }),
    prisma.finding.findMany({
      where: { checkRunId: previousRun.id, resolvedAt: null },
      select: { id: true, checkId: true },
    }),
  ]);

  const latestCheckIds = new Set(latestFindings.map((f) => f.checkId));

  // Find findings from previous run that don't appear in latest
  const resolved = previousFindings.filter((f) => !latestCheckIds.has(f.checkId));

  if (resolved.length === 0) return 0;

  // Mark them as resolved
  const result = await prisma.finding.updateMany({
    where: { id: { in: resolved.map((f) => f.id) } },
    data: { resolvedAt: new Date() },
  });

  // Also resolve associated alerts
  await prisma.alert.updateMany({
    where: {
      status: "ACTIVE",
      findingId: { in: resolved.map((f) => f.id) },
    },
    data: { status: "RESOLVED", resolvedAt: new Date() },
  });

  logger.info(`Auto-resolved ${result.count} findings for project ${projectId}`);
  return result.count;
}
