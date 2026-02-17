import { prisma } from "@/db/prisma";
import { Prisma, Severity } from "@prisma/client";
import { checkAds } from "./ads";
import { checkProducts } from "./products";
import { checkKeywords } from "./keywords";
import { checkBilling } from "./billing";
import { checkChanges } from "./changes";
import { checkPerformance } from "./performance";
import { AdAccountContext, CheckFinding, MerchantAccountContext } from "./types";
import { sendAlert } from "@/notifications/slack";

export async function runAllChecks(projectId: string): Promise<CheckFinding[]> {
  const [adAccounts, merchantAccounts, checkConfigs] = await Promise.all([
    prisma.adAccount.findMany({
      where: { projectId, active: true },
    }),
    prisma.merchantAccount.findMany({
      where: { projectId, active: true },
    }),
    prisma.checkConfig.findMany({
      where: { projectId },
    }),
  ]);

  const disabledChecks = new Set(
    checkConfigs.filter((c) => !c.enabled).map((c) => c.checkId)
  );

  const thresholdMap = new Map(
    checkConfigs
      .filter((c) => c.threshold)
      .map((c) => [c.checkId, c.threshold as Record<string, unknown>])
  );

  const allFindings: CheckFinding[] = [];

  for (const account of adAccounts) {
    const ctx: AdAccountContext = {
      id: account.id,
      projectId: account.projectId,
      platform: account.platform,
      externalId: account.externalId,
      name: account.name,
      credentials: account.credentials as Record<string, unknown> | null,
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
        projectId: merchant.projectId,
        externalId: merchant.externalId,
        name: merchant.name,
        feedUrl: merchant.feedUrl,
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
  const projects = await prisma.project.findMany({ select: { id: true, name: true } });
  let totalFindings = 0;

  for (const project of projects) {
    const checkRun = await prisma.checkRun.create({
      data: { projectId: project.id },
    });

    try {
      const findings = await runAllChecks(project.id);
      totalFindings += findings.length;

      if (findings.length > 0) {
        await prisma.finding.createMany({
          data: findings.map((f) => ({
            checkRunId: checkRun.id,
            checkId: f.checkId,
            severity: f.severity as Severity,
            title: f.title,
            message: f.message,
            data: f.data ? (f.data as Prisma.InputJsonValue) : Prisma.JsonNull,
          })),
        });

        // Send alerts for critical/high findings
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

      await prisma.checkRun.update({
        where: { id: checkRun.id },
        data: { status: "completed", endedAt: new Date() },
      });
    } catch (error) {
      await prisma.checkRun.update({
        where: { id: checkRun.id },
        data: { status: "failed", endedAt: new Date() },
      });
      throw error;
    }
  }

  return { projectsChecked: projects.length, totalFindings };
}
