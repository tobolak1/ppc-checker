import supabase from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const { data: templates } = await supabase
    .from("ppc_campaign_templates")
    .select("*, ppc_projects(name)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Campaigns</h1>
      <div className="bg-white rounded-lg shadow">
        {!templates?.length ? (
          <p className="p-6 text-gray-500">No campaign templates yet. Connect a Merchant Center account to start building campaigns from feeds.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Platform</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {templates.map((t: Record<string, string | boolean>) => (
                <tr key={t.id as string}>
                  <td className="px-4 py-3 font-medium">{t.name as string}</td>
                  <td className="px-4 py-3">{t.campaign_type as string}</td>
                  <td className="px-4 py-3">{t.platform as string}</td>
                  <td className="px-4 py-3">{t.active ? "Active" : "Inactive"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
