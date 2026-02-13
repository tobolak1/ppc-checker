import { Finding } from "./runner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function checkProducts(merchant: any): Promise<Finding[]> {
  const findings: Finding[] = [];

  if (!merchant.feed_url && !merchant.external_id) {
    findings.push({
      check_id: "mc-no-credentials",
      severity: "INFO",
      title: `No Merchant Center configured for ${merchant.name}`,
      message: `Connect Merchant Center API credentials to enable product monitoring.`,
    });
    return findings;
  }

  // Checks that will work once Merchant API is connected:
  // mc-disapproved: Produkt DISAPPROVED, alert pokud > 5% zamitnuto
  // mc-expiring: Produkty s expiraci do 3 dni
  // mc-feed-errors: Feed processing errors > 0
  // mc-price-mismatch: Cena ve feedu != cena na webu
  // mc-account-issues: MC account warning nebo suspension
  // mc-pending-spike: PENDING produkty +20%
  // mc-availability: in_stock ale na webu out_of_stock

  return findings;
}
