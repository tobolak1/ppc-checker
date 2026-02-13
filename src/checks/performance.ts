import { Finding } from "./runner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function checkPerformance(account: any): Promise<Finding[]> {
  if (!account.credentials) return [];

  // Checks ready for API:
  // perf-ctr-drop: CTR kleslo >30% vs 7d prumer
  // perf-impr-drop: Impressions -50% day-over-day
  // perf-spend-anomaly: Utrata mimo 2x smerod. odchylku
  // perf-lost-is-budget: Lost IS (budget) > 20%
  // perf-lost-is-rank: Lost IS (rank) > 40%

  return [];
}
