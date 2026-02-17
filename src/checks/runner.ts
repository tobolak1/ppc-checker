import { db, T } from "@/db";
import type { Severity, AdAccount, MerchantAccount, CheckConfig } from "@/db/types";
import { checkAds } from "./ads";
import { checkProducts } from "./products";
import { checkKeywords } from "./keywords";
import { checkBilling } from "./billing";
import { checkChanges } from "./changes";
import { checkPerformance } from "./performance";
import { AdAccountContext, CheckFinding, MerchantAccountContext } from "./types";
import { sendAlert } from "@/notifications/slack";

export async function runAllChecks(projectId: string): Promise<CheckFinding[]> {
  const [adRes, merchantRes, configRes] = await Promise.all([
    db.from(T.adAccounts).select("*").eq("project_id", projectId).eq("active", true),
    db.from(T.merchantAccounts).select("*").eq("project_id", projectId).eq("active", true),
    db.from(T.checkConfigs).select("*").eq("project_id", projectId),
  ]);

  const adAccounts = (adRes.data ?? []) as AdAccount[];
  const merchantAccounts = (merchantRes.data ?? []) as MerchantAccount[];
  const checkConfigs = (configRes.data ?? []) as CheckConfig[];

  const disabledChecks = new Set(
    checkConfigs.filter((c) => !c.enabled).map((c) => c.check_id)
  );

  const thresholdMap = new Map(
    checkConfigs
      .filter((c) => c.threshold)
      .map((c) => [c.check_id, c.threshold as Record<string, unknown>])
  );

  const allFindings: CheckFinding[] = [];

  for (const account of adAccounts) {
    const ctx: AdAccountContext = {
      id: account.id,
      projectId: account.project_id,
      platform: account.platform,
      externalId: account.external_id,
      name: account.name,
      credentials: account.credentials,
    };

    const checkGroups = [
      { prefix: "ads", fn: checkAds },
      { prefix: "kw", fn: checkKeywords },
      { prefix: "bill", fn: checkBilling },
      { prefix: "chg", fn: checkChanges },
      { prefix: "perf", fn: checkPerformance },
    ];

    for (const { prefix, fn } of checkGroups) {
      if (!disabledChecks.has(prefix)) {
        const findings = await fn(ctx, thresholdMap.get(prefix));
        allFindings.push(...findings);
      }
    }
  }

  for (const merchant of merchantAccounts) {
    if (!disabledChecks.has("products")) {
      const ctx: MerchantAccountContext = {
        id: merchant.id,
        projectId: merchant.project_id,
        externalId: merchant.external_id,
        name: merchant.name,
        feedUrl: merchant.feed_url,
      };
      allFindings.push(...(await checkProducts(ctx, thresholdMap.get("products"))));
    }
  }

  return allFindings;
}

export async function runChecksForAllProjects(): Promise<{
  projectsChecked: number;
  totalFindings: number;
}> {
  const { data: projects } = await db.from(T.projects).select("id, name");
  let totalFindings = 0;

  for (const project of projects ?? []) {
    const { data: checkRun } = await db
      .from(T.checkRuns)
      .insert({ project_id: project.id })
      .select("id")
      .single();

    if (!checkRun) continue;

    try {
      const findings = await runAllChecks(project.id);
      totalFindings += findings.length;

      if (findings.length > 0) {
        await db.from(T.findings).insert(
          findings.map((f) => ({
            check_run_id: checkRun.id,
            check_id: f.checkId,
            severity: f.severity as Severity,
            title: f.title,
            message: f.message,
            data: f.data ?? null,
          }))
        );

        for (const finding of findings) {
          if (finding.severity === "CRITICAL" || finding.severity === "HIGH") {
            await sendAlert({
              projectName: project.name,
              finding,
            }).catch(() => {
              // Alert sending is best-effort
            });
          }
        }
      }

      await db
        .from(T.checkRuns)
        .update({ status: "completed", ended_at: new Date().toISOString() })
        .eq("id", checkRun.id);
    } catch (error) {
      await db
        .from(T.checkRuns)
        .update({ status: "failed", ended_at: new Date().toISOString() })
        .eq("id", checkRun.id);
      throw error;
    }
  }

  return { projectsChecked: projects?.length ?? 0, totalFindings };
}
