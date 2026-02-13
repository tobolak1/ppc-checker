import supabase from "@/lib/supabase";
import { checkAds } from "./ads";
import { checkProducts } from "./products";
import { checkKeywords } from "./keywords";
import { checkBilling } from "./billing";
import { checkChanges } from "./changes";
import { checkPerformance } from "./performance";

export interface Finding {
  check_id: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export async function runAllChecks(projectId: string): Promise<Finding[]> {
  // Get project's ad accounts and merchant accounts
  const [{ data: adAccounts }, { data: merchantAccounts }, { data: checkConfigs }] = await Promise.all([
    supabase.from("ppc_ad_accounts").select("*").eq("project_id", projectId).eq("active", true),
    supabase.from("ppc_merchant_accounts").select("*").eq("project_id", projectId).eq("active", true),
    supabase.from("ppc_check_configs").select("*").eq("project_id", projectId),
  ]);

  const disabledChecks = new Set(
    (checkConfigs || []).filter((c: Record<string, boolean>) => !c.enabled).map((c: Record<string, string>) => c.check_id)
  );

  const allFindings: Finding[] = [];

  // Run checks for each ad account
  for (const account of adAccounts || []) {
    const checks = [
      ...(!disabledChecks.has("ads") ? await checkAds(account) : []),
      ...(!disabledChecks.has("keywords") ? await checkKeywords(account) : []),
      ...(!disabledChecks.has("billing") ? await checkBilling(account) : []),
      ...(!disabledChecks.has("changes") ? await checkChanges(account) : []),
      ...(!disabledChecks.has("performance") ? await checkPerformance(account) : []),
    ];
    allFindings.push(...checks);
  }

  // Run merchant center checks
  for (const merchant of merchantAccounts || []) {
    if (!disabledChecks.has("products")) {
      allFindings.push(...(await checkProducts(merchant)));
    }
  }

  return allFindings;
}
