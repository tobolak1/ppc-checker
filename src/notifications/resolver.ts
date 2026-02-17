import { db, T } from "@/db";
import type { CheckRun, Finding } from "@/db/types";
import { logger } from "@/lib/logger";

/**
 * Resolves findings that no longer appear in the latest check run.
 * Call this after a successful check run to auto-resolve disappeared issues.
 */
export async function resolveDisappearedFindings(projectId: string): Promise<number> {
  // Get the last two completed check runs for this project
  const { data: lastRuns } = await db
    .from(T.checkRuns)
    .select("id")
    .eq("project_id", projectId)
    .eq("status", "completed")
    .order("started_at", { ascending: false })
    .limit(2);

  if (!lastRuns || lastRuns.length < 2) return 0;

  const [latestRun, previousRun] = lastRuns as Pick<CheckRun, "id">[];

  // Get check IDs from both runs
  const [latestRes, previousRes] = await Promise.all([
    db.from(T.findings).select("check_id").eq("check_run_id", latestRun.id),
    db.from(T.findings).select("id, check_id").eq("check_run_id", previousRun.id).is("resolved_at", null),
  ]);

  const latestCheckIds = new Set(
    ((latestRes.data ?? []) as Pick<Finding, "check_id">[]).map((f) => f.check_id)
  );

  // Find findings from previous run that don't appear in latest
  const resolved = ((previousRes.data ?? []) as Pick<Finding, "id" | "check_id">[])
    .filter((f) => !latestCheckIds.has(f.check_id));

  if (resolved.length === 0) return 0;

  const resolvedIds = resolved.map((f) => f.id);
  const now = new Date().toISOString();

  // Mark them as resolved
  await db
    .from(T.findings)
    .update({ resolved_at: now })
    .in("id", resolvedIds);

  // Also resolve associated alerts
  await db
    .from(T.alerts)
    .update({ status: "RESOLVED", resolved_at: now })
    .eq("status", "ACTIVE")
    .in("finding_id", resolvedIds);

  logger.info(`Auto-resolved ${resolved.length} findings for project ${projectId}`);
  return resolved.length;
}
