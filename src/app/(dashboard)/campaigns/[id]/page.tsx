import { prisma } from "@/db/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const template = await prisma.campaignTemplate.findUnique({
    where: { id },
    include: {
      project: { select: { name: true } },
      generatedCampaigns: {
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { syncLogs: true } },
        },
      },
    },
  });

  if (!template) notFound();

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
        <p className="text-gray-500">{template.project.name} | {template.campaignType} | {template.platform}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Budget</p>
          <p className="text-xl font-bold">{template.budget?.toString() || "—"}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Strategy</p>
          <p className="text-xl font-bold">{template.biddingStrategy || "—"}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Generated Campaigns</p>
          <p className="text-xl font-bold">{template.generatedCampaigns.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <h2 className="font-semibold p-4 border-b">Generated Campaigns</h2>
        {!template.generatedCampaigns.length ? (
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
              {template.generatedCampaigns.map((gc) => (
                <tr key={gc.id}>
                  <td className="px-4 py-3 font-medium">{gc.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[gc.status]}`}>{gc.status}</span>
                  </td>
                  <td className="px-4 py-3">{gc._count.syncLogs}</td>
                  <td className="px-4 py-3 text-gray-500">{gc.syncedAt ? new Date(gc.syncedAt).toLocaleString() : "Never"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
