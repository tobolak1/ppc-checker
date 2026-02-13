import { Finding } from "./runner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function checkChanges(account: any): Promise<Finding[]> {
  if (!account.credentials) return [];

  // Checks ready for API:
  // chg-campaign-paused: Kampan ENABLED -> PAUSED/REMOVED
  // chg-budget-spike: Budget zmenen o >50%
  // chg-bid-spike: CPC bid zmenen o >100%
  // chg-conv-drop: Konverze -50% vs 7d prumer
  // chg-cpc-spike: CPC +100% vs 7d prumer
  // chg-access: Novy uzivatel nebo zmena opravneni
  // chg-tracking-gone: Konverzni akce smazana
  // chg-strategy: Bidding strategie zmenena

  return [];
}
