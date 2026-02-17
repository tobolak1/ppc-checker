import { AdAccountContext, CheckFinding, CheckThresholds, GoogleAdsCampaign, GoogleAdsChangeEvent } from "./types";

export async function checkChanges(
  account: AdAccountContext,
  thresholds?: CheckThresholds
): Promise<CheckFinding[]> {
  if (!account.credentials) return [];
  const findings: CheckFinding[] = [];

  const campaigns = await fetchCampaigns(account);
  const changes = await fetchChangeHistory(account);

  // chg-campaign-paused: Campaign with spend went ENABLED -> PAUSED/REMOVED
  const pausedCampaigns = campaigns.filter(
    (c) => (c.status === "PAUSED" || c.status === "REMOVED") &&
    c.previousStatus === "ENABLED" && c.dailySpend > 0
  );
  if (pausedCampaigns.length > 0) {
    findings.push({
      checkId: "chg-campaign-paused",
      severity: "CRITICAL",
      title: `${pausedCampaigns.length} active campaign(s) paused/removed`,
      message: `Campaigns with daily spend were paused or removed in ${account.name}.`,
      data: {
        campaigns: pausedCampaigns.map((c) => ({
          name: c.name, status: c.status, dailySpend: c.dailySpend,
        })),
      },
    });
  }

  // chg-budget-spike: Daily budget changed by >50%
  const budgetSpikePct = (thresholds?.budgetSpikePct as number) ?? 50;
  const budgetChanges = campaigns.filter((c) => {
    if (!c.previousDailyBudget || c.previousDailyBudget === 0) return false;
    const changePct = Math.abs((c.dailyBudget - c.previousDailyBudget) / c.previousDailyBudget) * 100;
    return changePct > budgetSpikePct;
  });
  if (budgetChanges.length > 0) {
    findings.push({
      checkId: "chg-budget-spike",
      severity: "HIGH",
      title: `${budgetChanges.length} campaign(s) with budget change >${budgetSpikePct}%`,
      message: `Significant budget changes detected that may affect account performance.`,
      data: {
        campaigns: budgetChanges.map((c) => ({
          name: c.name, oldBudget: c.previousDailyBudget, newBudget: c.dailyBudget,
        })),
      },
    });
  }

  // chg-bid-spike: CPC bid changed by >100%
  const bidSpikeChanges = changes.filter((c) => c.changeType === "BID");
  if (bidSpikeChanges.length > 0) {
    findings.push({
      checkId: "chg-bid-spike",
      severity: "HIGH",
      title: `${bidSpikeChanges.length} significant bid change(s)`,
      message: `Bid values changed by more than 100% in ${account.name}.`,
      data: {
        changes: bidSpikeChanges.map((c) => ({
          entity: c.entityName, old: c.oldValue, new: c.newValue, by: c.changedBy,
        })),
      },
    });
  }

  // chg-access: New user or permission change
  const accessChanges = changes.filter((c) => c.changeType === "ACCESS");
  if (accessChanges.length > 0) {
    findings.push({
      checkId: "chg-access",
      severity: "CRITICAL",
      title: `${accessChanges.length} access change(s) detected`,
      message: `User access or permissions were modified on ${account.name}.`,
      data: {
        changes: accessChanges.map((c) => ({
          entity: c.entityName, old: c.oldValue, new: c.newValue, by: c.changedBy, date: c.changeDate,
        })),
      },
    });
  }

  // chg-tracking-gone: Conversion action deleted or deactivated
  const trackingChanges = changes.filter((c) => c.changeType === "CONVERSION_ACTION");
  if (trackingChanges.length > 0) {
    findings.push({
      checkId: "chg-tracking-gone",
      severity: "CRITICAL",
      title: `Conversion tracking modified`,
      message: `Conversion actions were deleted or deactivated in ${account.name}. This will affect reporting.`,
      data: { changes: trackingChanges },
    });
  }

  // chg-strategy: Bidding strategy changed
  const strategyChanges = campaigns.filter(
    (c) => c.previousBiddingStrategy && c.biddingStrategy !== c.previousBiddingStrategy
  );
  if (strategyChanges.length > 0) {
    findings.push({
      checkId: "chg-strategy",
      severity: "HIGH",
      title: `${strategyChanges.length} bidding strategy change(s)`,
      message: `Bidding strategies were changed, which may affect performance and learning periods.`,
      data: {
        campaigns: strategyChanges.map((c) => ({
          name: c.name, old: c.previousBiddingStrategy, new: c.biddingStrategy,
        })),
      },
    });
  }

  return findings;
}

async function fetchCampaigns(_account: AdAccountContext): Promise<GoogleAdsCampaign[]> {
  return [];
}

async function fetchChangeHistory(_account: AdAccountContext): Promise<GoogleAdsChangeEvent[]> {
  return [];
}
