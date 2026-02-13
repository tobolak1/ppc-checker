import { Finding } from "./runner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function checkAds(account: any): Promise<Finding[]> {
  const findings: Finding[] = [];

  // TODO: Replace with real Google Ads API / Sklik API calls when credentials are available
  // Currently returns empty - no API credentials configured

  if (!account.credentials) {
    findings.push({
      check_id: "ads-no-credentials",
      severity: "INFO",
      title: `No API credentials for ${account.name}`,
      message: `Account ${account.name} (${account.platform}) has no API credentials configured. Add credentials in project settings to enable monitoring.`,
      data: { account_id: account.external_id, platform: account.platform },
    });
    return findings;
  }

  // Checks that will work once API is connected:
  // ads-disapproved: Reklama ma status DISAPPROVED nebo POLICY_VIOLATION
  // ads-limited: Reklama UNDER_REVIEW > 48h nebo LIMITED
  // ads-no-active: ENABLED ad group s 0 aktivnimi reklamami
  // ads-rsa-pinning: RSA ma vsechny pozice pinnute
  // ads-low-strength: RSA Ad Strength = POOR
  // ads-expiring-promo: Promotion extension expiruje do 3 dni

  return findings;
}
