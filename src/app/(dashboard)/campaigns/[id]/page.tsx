import { db, T } from "@/db";
import type { CampaignTemplate, GeneratedCampaign, Project } from "@/db/types";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: template } = await db
    .from(T.campaignTemplates)
    .select("*, project:ppc_projects(name)")
    .eq("id", id)
    .single<CampaignTemplate & { project: Pick<Project, "name"> | null }>();

  if (!template) notFound();

  const { data: gcRaw } = await db
    .from(T.generatedCampaigns)
    .select("*")
    .eq("template_id", id)
    .order("created_at", { ascending: false });

  const generatedCampaigns = (gcRaw ?? []) as GeneratedCampaign[];

  // Get sync log counts
  const syncCounts = await Promise.all(
    generatedCampaigns.map(async (gc) => {
      const { count } = await db
        .from(T.syncLogs)
        .select("id", { count: "exact", head: true })
        .eq("generated_campaign_id", gc.id);
      return count ?? 0;
    })
  );

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    preview: "bg-blue-100 text-blue-800",
    active: "bg-green-100 text-green-800",
    paused: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800",
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{template.name}</h1>
        <p className="text-gray-500">{template.project?.name ?? "—"} | {template.campaign_type} | {template.platform}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Budget</p>
          <p className="text-xl font-bold">{template.budget?.toString() || "—"}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Strategy</p>
          <p className="text-xl font-bold">{template.bidding_strategy || "—"}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Generated Campaigns</p>
          <p className="text-xl font-bold">{generatedCampaigns.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <h2 className="font-semibold p-4 border-b">Generated Campaigns</h2>
        {!generatedCampaigns.length ? (
          <p className="p-4 text-sm text-gray-500">No campaigns generated yet. Connect a feed and click Generate.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Sync Logs</th>
                <th className="px-4 py-3">Last Synced</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {generatedCampaigns.map((gc, i) => (
                <tr key={gc.id}>
                  <td className="px-4 py-3 font-medium">{gc.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[gc.status]}`}>{gc.status}</span>
                  </td>
                  <td className="px-4 py-3">{syncCounts[i]}</td>
                  <td className="px-4 py-3 text-gray-500">{gc.synced_at ? new Date(gc.synced_at).toLocaleString() : "Never"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
