import { AdAccountContext, CheckFinding, CheckThresholds, GoogleAdsAd, GoogleAdsAdGroup } from "./types";

export async function checkAds(
  account: AdAccountContext,
  thresholds?: CheckThresholds
): Promise<CheckFinding[]> {
  const findings: CheckFinding[] = [];

  if (!account.credentials) {
    findings.push({
      checkId: "ads-no-credentials",
      severity: "INFO",
      title: `No API credentials for ${account.name}`,
      message: `Account ${account.name} (${account.platform}) has no API credentials configured.`,
      data: { accountId: account.externalId, platform: account.platform },
    });
    return findings;
  }

  // Fetch data from API (placeholder - will use real API clients)
  const ads = await fetchAds(account);
  const adGroups = await fetchAdGroups(account);

  // ads-disapproved: Ads with DISAPPROVED status
  const disapproved = ads.filter((a) => a.status === "DISAPPROVED");
  if (disapproved.length > 0) {
    findings.push({
      checkId: "ads-disapproved",
      severity: "CRITICAL",
      title: `${disapproved.length} disapproved ad(s) in ${account.name}`,
      message: `Found ${disapproved.length} ads with DISAPPROVED or POLICY_VIOLATION status. These ads are not serving.`,
      data: { ads: disapproved.map((a) => ({ id: a.id, adGroup: a.adGroupName, policy: a.policyStatus })) },
    });
  }

  // ads-limited: Ads under review for >48h or LIMITED
  const now = Date.now();
  const limitedAds = ads.filter((a) => {
    if (a.status === "LIMITED") return true;
    if (a.status === "UNDER_REVIEW" && a.lastStatusChange) {
      const hoursInReview = (now - new Date(a.lastStatusChange).getTime()) / (1000 * 60 * 60);
      return hoursInReview > 48;
    }
    return false;
  });
  if (limitedAds.length > 0) {
    findings.push({
      checkId: "ads-limited",
      severity: "HIGH",
      title: `${limitedAds.length} limited/stuck ad(s) in ${account.name}`,
      message: `Found ${limitedAds.length} ads that are LIMITED or stuck in UNDER_REVIEW for more than 48 hours.`,
      data: { ads: limitedAds.map((a) => ({ id: a.id, status: a.status, adGroup: a.adGroupName })) },
    });
  }

  // ads-no-active: Enabled ad groups with 0 active ads
  const emptyAdGroups = adGroups.filter((ag) => ag.status === "ENABLED" && ag.activeAdsCount === 0);
  if (emptyAdGroups.length > 0) {
    findings.push({
      checkId: "ads-no-active",
      severity: "HIGH",
      title: `${emptyAdGroups.length} ad group(s) without active ads`,
      message: `Found ${emptyAdGroups.length} ENABLED ad groups with 0 active ads. These ad groups cannot serve.`,
      data: { adGroups: emptyAdGroups.map((ag) => ({ id: ag.id, name: ag.name })) },
    });
  }

  // ads-rsa-pinning: RSA with all positions pinned
  const overPinnedRsas = ads.filter(
    (a) => a.type === "RSA" && a.pinnedPositions && a.headlines &&
    a.pinnedPositions.length >= a.headlines.length
  );
  if (overPinnedRsas.length > 0) {
    findings.push({
      checkId: "ads-rsa-pinning",
      severity: "MEDIUM",
      title: `${overPinnedRsas.length} RSA(s) with all positions pinned`,
      message: `Found RSA ads where all headline/description positions are pinned, limiting Google's optimization ability.`,
      data: { ads: overPinnedRsas.map((a) => ({ id: a.id, adGroup: a.adGroupName })) },
    });
  }

  // ads-low-strength: RSA Ad Strength = POOR
  const poorStrength = ads.filter((a) => a.type === "RSA" && a.adStrength === "POOR");
  if (poorStrength.length > 0) {
    findings.push({
      checkId: "ads-low-strength",
      severity: "LOW",
      title: `${poorStrength.length} RSA(s) with POOR ad strength`,
      message: `Found RSA ads with POOR ad strength. Consider adding more headlines and descriptions.`,
      data: { ads: poorStrength.map((a) => ({ id: a.id, adGroup: a.adGroupName, strength: a.adStrength })) },
    });
  }

  // ads-expiring-promo: Promotion extension expiring within 3 days
  const expiringDays = (thresholds?.expiringPromoDays as number) ?? 3;
  const expiringPromos = ads.filter((a) => {
    if (!a.promotionEndDate) return false;
    const daysLeft = (new Date(a.promotionEndDate).getTime() - now) / (1000 * 60 * 60 * 24);
    return daysLeft > 0 && daysLeft <= expiringDays;
  });
  if (expiringPromos.length > 0) {
    findings.push({
      checkId: "ads-expiring-promo",
      severity: "MEDIUM",
      title: `${expiringPromos.length} promotion(s) expiring within ${expiringDays} days`,
      message: `Found ads with promotion extensions about to expire. Update or remove them to avoid showing expired promos.`,
      data: { ads: expiringPromos.map((a) => ({ id: a.id, promoEnd: a.promotionEndDate })) },
    });
  }

  return findings;
}

// Placeholder API fetch functions - will be replaced by real API client calls
async function fetchAds(_account: AdAccountContext): Promise<GoogleAdsAd[]> {
  // TODO: Call GoogleAdsClient.getAds() or SklikClient.getAds()
  return [];
}

async function fetchAdGroups(_account: AdAccountContext): Promise<GoogleAdsAdGroup[]> {
  // TODO: Call GoogleAdsClient.getAdGroups()
  return [];
}
