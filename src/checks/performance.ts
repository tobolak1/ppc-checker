import { AdAccountContext, CheckFinding, CheckThresholds, GoogleAdsMetrics } from "./types";

export async function checkPerformance(
  account: AdAccountContext,
  thresholds?: CheckThresholds
): Promise<CheckFinding[]> {
  if (!account.credentials) return [];
  const findings: CheckFinding[] = [];

  const metrics = await fetchMetrics(account);
  if (metrics.length < 2) return findings;

  const today = metrics[0];
  const yesterday = metrics[1];
  const last7d = metrics.slice(0, 7);

  const avg7d = {
    impressions: last7d.reduce((s, m) => s + m.impressions, 0) / last7d.length,
    ctr: last7d.reduce((s, m) => s + m.ctr, 0) / last7d.length,
    cost: last7d.reduce((s, m) => s + m.cost, 0) / last7d.length,
    conversions: last7d.reduce((s, m) => s + m.conversions, 0) / last7d.length,
    avgCpc: last7d.reduce((s, m) => s + m.avgCpc, 0) / last7d.length,
  };

  // perf-ctr-drop: CTR dropped >30% vs 7-day average
  const ctrDropPct = (thresholds?.ctrDropPct as number) ?? 30;
  if (avg7d.ctr > 0) {
    const ctrDrop = ((avg7d.ctr - today.ctr) / avg7d.ctr) * 100;
    if (ctrDrop > ctrDropPct) {
      findings.push({
        checkId: "perf-ctr-drop",
        severity: "MEDIUM",
        title: `CTR dropped ${ctrDrop.toFixed(1)}% in ${account.name}`,
        message: `Click-through rate fell from ${(avg7d.ctr * 100).toFixed(2)}% (7d avg) to ${(today.ctr * 100).toFixed(2)}% today.`,
        data: { todayCtr: today.ctr, avgCtr: avg7d.ctr, dropPct: ctrDrop },
      });
    }
  }

  // perf-impr-drop: Impressions dropped >50% day-over-day
  const imprDropPct = (thresholds?.imprDropPct as number) ?? 50;
  if (yesterday.impressions > 0) {
    const imprDrop = ((yesterday.impressions - today.impressions) / yesterday.impressions) * 100;
    if (imprDrop > imprDropPct) {
      findings.push({
        checkId: "perf-impr-drop",
        severity: "HIGH",
        title: `Impressions dropped ${imprDrop.toFixed(1)}% in ${account.name}`,
        message: `Impressions fell from ${yesterday.impressions.toLocaleString()} to ${today.impressions.toLocaleString()} day-over-day.`,
        data: { todayImpr: today.impressions, yesterdayImpr: yesterday.impressions, dropPct: imprDrop },
      });
    }
  }

  // perf-spend-anomaly: Daily spend outside 2x std dev from 14-day average
  if (metrics.length >= 14) {
    const last14d = metrics.slice(0, 14);
    const avgCost14d = last14d.reduce((s, m) => s + m.cost, 0) / 14;
    const stdDev = Math.sqrt(last14d.reduce((s, m) => s + Math.pow(m.cost - avgCost14d, 2), 0) / 14);
    const deviation = Math.abs(today.cost - avgCost14d);
    if (stdDev > 0 && deviation > 2 * stdDev) {
      findings.push({
        checkId: "perf-spend-anomaly",
        severity: "HIGH",
        title: `Spend anomaly detected in ${account.name}`,
        message: `Today's spend (${today.cost.toFixed(2)}) is ${(deviation / stdDev).toFixed(1)}x standard deviations from 14-day average (${avgCost14d.toFixed(2)}).`,
        data: { todayCost: today.cost, avgCost: avgCost14d, stdDev, deviations: deviation / stdDev },
      });
    }
  }

  // perf-lost-is-budget: Search Lost IS (budget) > 20%
  const lostIsBudgetThreshold = (thresholds?.lostIsBudget as number) ?? 20;
  if (today.searchImpressionShareLostBudget !== undefined &&
      today.searchImpressionShareLostBudget > lostIsBudgetThreshold) {
    findings.push({
      checkId: "perf-lost-is-budget",
      severity: "MEDIUM",
      title: `Lost IS (budget) ${today.searchImpressionShareLostBudget.toFixed(1)}% in ${account.name}`,
      message: `Losing ${today.searchImpressionShareLostBudget.toFixed(1)}% of search impression share due to budget constraints.`,
      data: { lostIsBudget: today.searchImpressionShareLostBudget },
    });
  }

  // perf-lost-is-rank: Search Lost IS (rank) > 40%
  const lostIsRankThreshold = (thresholds?.lostIsRank as number) ?? 40;
  if (today.searchImpressionShareLostRank !== undefined &&
      today.searchImpressionShareLostRank > lostIsRankThreshold) {
    findings.push({
      checkId: "perf-lost-is-rank",
      severity: "MEDIUM",
      title: `Lost IS (rank) ${today.searchImpressionShareLostRank.toFixed(1)}% in ${account.name}`,
      message: `Losing ${today.searchImpressionShareLostRank.toFixed(1)}% of search impression share due to ad rank.`,
      data: { lostIsRank: today.searchImpressionShareLostRank },
    });
  }

  return findings;
}

async function fetchMetrics(_account: AdAccountContext): Promise<GoogleAdsMetrics[]> {
  // Returns daily metrics sorted by date descending (today first)
  return [];
}
