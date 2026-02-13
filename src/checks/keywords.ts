import { Finding } from "./runner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function checkKeywords(account: any): Promise<Finding[]> {
  if (!account.credentials) return [];

  // Checks ready for Google Ads API:
  // kw-overlap: Stejne keyword ve 2+ kampanich
  // kw-negative-conflict: Negativni KW blokuje aktivni KW
  // kw-duplicate-ag: Stejne KW v jedne ad group
  // kw-low-qs: QS <= 4 a > 100 impressions / 30 dni
  // kw-no-impressions: 0 impressions / 30 dni
  // kw-search-terms: Vysoka utrata, 0 konverzi

  return [];
}
