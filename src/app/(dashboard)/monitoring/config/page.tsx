import { db, T } from "@/db";
import type { Project, CheckConfig } from "@/db/types";

export const dynamic = "force-dynamic";

const ALL_CHECKS = [
  { id: "ads-disapproved", label: "Disapproved ads", category: "Ads" },
  { id: "ads-limited", label: "Limited ads", category: "Ads" },
  { id: "ads-no-active", label: "Ad groups without active ads", category: "Ads" },
  { id: "ads-rsa-pinning", label: "RSA over-pinning", category: "Ads" },
  { id: "ads-low-strength", label: "Low RSA ad strength", category: "Ads" },
  { id: "ads-expiring-promo", label: "Expiring promotions", category: "Ads" },
  { id: "kw-overlap", label: "Keyword overlap across campaigns", category: "Keywords" },
  { id: "kw-negative-conflict", label: "Negative keyword conflicts", category: "Keywords" },
  { id: "kw-duplicate-ag", label: "Duplicate KW in ad group", category: "Keywords" },
  { id: "kw-low-qs", label: "Low Quality Score", category: "Keywords" },
  { id: "kw-no-impressions", label: "Keywords with zero impressions", category: "Keywords" },
  { id: "kw-search-terms", label: "Problematic search terms", category: "Keywords" },
  { id: "mc-disapproved", label: "Disapproved products", category: "Products" },
  { id: "mc-expiring", label: "Expiring products", category: "Products" },
  { id: "mc-feed-errors", label: "Feed errors", category: "Products" },
  { id: "mc-price-mismatch", label: "Price mismatch", category: "Products" },
  { id: "mc-account-issues", label: "Account issues", category: "Products" },
  { id: "mc-pending-spike", label: "Pending products spike", category: "Products" },
  { id: "mc-availability", label: "Availability mismatch", category: "Products" },
  { id: "bill-low-balance", label: "Low credit balance", category: "Billing" },
  { id: "bill-payment-fail", label: "Payment failure", category: "Billing" },
  { id: "bill-card-expiring", label: "Card expiring", category: "Billing" },
  { id: "bill-no-backup", label: "No backup payment", category: "Billing" },
  { id: "bill-budget-depleted", label: "Budget depleted early", category: "Billing" },
  { id: "bill-sklik-credit", label: "Sklik low credit", category: "Billing" },
  { id: "chg-campaign-paused", label: "Campaign paused", category: "Changes" },
  { id: "chg-budget-spike", label: "Budget spike", category: "Changes" },
  { id: "chg-bid-spike", label: "Bid spike", category: "Changes" },
  { id: "chg-access", label: "Access changes", category: "Changes" },
  { id: "chg-tracking-gone", label: "Tracking removed", category: "Changes" },
  { id: "chg-strategy", label: "Strategy change", category: "Changes" },
  { id: "perf-ctr-drop", label: "CTR drop", category: "Performance" },
  { id: "perf-impr-drop", label: "Impressions drop", category: "Performance" },
  { id: "perf-spend-anomaly", label: "Spend anomaly", category: "Performance" },
  { id: "perf-lost-is-budget", label: "Lost IS (budget)", category: "Performance" },
  { id: "perf-lost-is-rank", label: "Lost IS (rank)", category: "Performance" },
];

export default async function CheckConfigPage() {
  const { data: projects } = await db
    .from(T.projects)
    .select("id, name")
    .order("name", { ascending: true });

  const { data: configsRaw } = await db.from(T.checkConfigs).select("*");
  const configs = (configsRaw ?? []) as CheckConfig[];
  const disabledMap = new Set(
    configs.filter((c) => !c.enabled).map((c) => `${c.project_id}:${c.check_id}`)
  );

  const categories = [...new Set(ALL_CHECKS.map((c) => c.category))];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Check Configuration</h1>
      {!projects?.length ? (
        <p className="text-gray-500">Create a project first to configure checks.</p>
      ) : (
        <div className="space-y-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-white rounded-lg shadow">
              <h2 className="font-semibold p-4 border-b">{project.name}</h2>
              <div className="p-4 space-y-4">
                {categories.map((cat) => (
                  <div key={cat}>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">{cat}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {ALL_CHECKS.filter((c) => c.category === cat).map((check) => {
                        const disabled = disabledMap.has(`${project.id}:${check.id}`);
                        return (
                          <div key={check.id} className="flex items-center gap-2 text-sm">
                            <span className={`w-2 h-2 rounded-full ${disabled ? "bg-gray-300" : "bg-green-500"}`} />
                            <span className={disabled ? "text-gray-400" : "text-gray-700"}>{check.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
