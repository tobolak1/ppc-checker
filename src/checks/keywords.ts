import { AdAccountContext, CheckFinding, CheckThresholds, GoogleAdsKeyword, GoogleAdsSearchTerm } from "./types";

export async function checkKeywords(
  account: AdAccountContext,
  thresholds?: CheckThresholds
): Promise<CheckFinding[]> {
  if (!account.credentials) return [];
  const findings: CheckFinding[] = [];

  const keywords = await fetchKeywords(account);
  const searchTerms = await fetchSearchTerms(account);

  // kw-overlap: Same keyword in 2+ campaigns
  const keywordMap = new Map<string, GoogleAdsKeyword[]>();
  for (const kw of keywords.filter((k) => !k.isNegative && k.status === "ENABLED")) {
    const key = `${kw.text.toLowerCase()}|${kw.matchType}`;
    const existing = keywordMap.get(key) || [];
    existing.push(kw);
    keywordMap.set(key, existing);
  }
  const overlapping = [...keywordMap.entries()].filter(([, kws]) => {
    const uniqueCampaigns = new Set(kws.map((k) => k.campaignId));
    return uniqueCampaigns.size > 1;
  });
  if (overlapping.length > 0) {
    findings.push({
      checkId: "kw-overlap",
      severity: "HIGH",
      title: `${overlapping.length} keyword(s) competing across campaigns`,
      message: `Found keywords appearing in multiple campaigns, causing internal auction competition.`,
      data: {
        keywords: overlapping.map(([key, kws]) => ({
          keyword: key.split("|")[0],
          matchType: key.split("|")[1],
          campaigns: [...new Set(kws.map((k) => k.campaignName))],
        })),
      },
    });
  }

  // kw-negative-conflict: Negative KW blocking active KW
  const negatives = keywords.filter((k) => k.isNegative && k.status === "ENABLED");
  const positives = keywords.filter((k) => !k.isNegative && k.status === "ENABLED");
  const conflicts: { negative: GoogleAdsKeyword; blocked: GoogleAdsKeyword }[] = [];
  for (const neg of negatives) {
    for (const pos of positives) {
      if (neg.campaignId === pos.campaignId && neg.text.toLowerCase() === pos.text.toLowerCase()) {
        conflicts.push({ negative: neg, blocked: pos });
      }
    }
  }
  if (conflicts.length > 0) {
    findings.push({
      checkId: "kw-negative-conflict",
      severity: "HIGH",
      title: `${conflicts.length} negative keyword conflict(s)`,
      message: `Negative keywords are blocking active keywords in the same campaign.`,
      data: {
        conflicts: conflicts.map((c) => ({
          keyword: c.blocked.text,
          campaign: c.blocked.campaignName,
          adGroup: c.blocked.adGroupName,
        })),
      },
    });
  }

  // kw-duplicate-ag: Same KW (different match type) in one ad group
  const agKeywords = new Map<string, GoogleAdsKeyword[]>();
  for (const kw of positives) {
    const key = `${kw.adGroupId}|${kw.text.toLowerCase()}`;
    const existing = agKeywords.get(key) || [];
    existing.push(kw);
    agKeywords.set(key, existing);
  }
  const duplicates = [...agKeywords.entries()].filter(([, kws]) => kws.length > 1);
  if (duplicates.length > 0) {
    findings.push({
      checkId: "kw-duplicate-ag",
      severity: "MEDIUM",
      title: `${duplicates.length} duplicate keyword(s) in ad groups`,
      message: `Found the same keyword with different match types in a single ad group.`,
      data: {
        duplicates: duplicates.map(([, kws]) => ({
          keyword: kws[0].text,
          adGroup: kws[0].adGroupName,
          matchTypes: kws.map((k) => k.matchType),
        })),
      },
    });
  }

  // kw-low-qs: QS <= 4 with >100 impressions in 30 days
  const minQs = (thresholds?.minQualityScore as number) ?? 4;
  const minImpressions = (thresholds?.minImpressions as number) ?? 100;
  const lowQs = positives.filter(
    (k) => k.qualityScore !== undefined && k.qualityScore <= minQs && k.impressions30d > minImpressions
  );
  if (lowQs.length > 0) {
    findings.push({
      checkId: "kw-low-qs",
      severity: "MEDIUM",
      title: `${lowQs.length} keyword(s) with low Quality Score`,
      message: `Keywords with QS <= ${minQs} and significant traffic. Improve ad relevance and landing pages.`,
      data: {
        keywords: lowQs.map((k) => ({
          keyword: k.text,
          qs: k.qualityScore,
          impressions: k.impressions30d,
          campaign: k.campaignName,
        })),
      },
    });
  }

  // kw-no-impressions: Active KW, 0 impressions in 30 days
  const noImpressions = positives.filter((k) => k.impressions30d === 0);
  if (noImpressions.length > 0) {
    findings.push({
      checkId: "kw-no-impressions",
      severity: "LOW",
      title: `${noImpressions.length} active keyword(s) with zero impressions`,
      message: `Keywords have been active for 30+ days without a single impression. Consider reviewing match types or pausing.`,
      data: {
        keywords: noImpressions.slice(0, 20).map((k) => ({
          keyword: k.text,
          matchType: k.matchType,
          campaign: k.campaignName,
        })),
      },
    });
  }

  // kw-search-terms: High spend, 0 conversions
  const spendThreshold = (thresholds?.searchTermSpendThreshold as number) ?? 50;
  const problematicTerms = searchTerms.filter(
    (st) => st.cost > spendThreshold && st.conversions === 0
  );
  if (problematicTerms.length > 0) {
    findings.push({
      checkId: "kw-search-terms",
      severity: "MEDIUM",
      title: `${problematicTerms.length} search term(s) with high spend and zero conversions`,
      message: `Search terms spending more than ${spendThreshold} with no conversions. Consider adding as negative keywords.`,
      data: {
        terms: problematicTerms.slice(0, 20).map((st) => ({
          term: st.searchTerm,
          cost: st.cost,
          clicks: st.clicks,
          campaign: st.campaignName,
        })),
      },
    });
  }

  return findings;
}

async function fetchKeywords(_account: AdAccountContext): Promise<GoogleAdsKeyword[]> {
  return [];
}

async function fetchSearchTerms(_account: AdAccountContext): Promise<GoogleAdsSearchTerm[]> {
  return [];
}
