import { prisma } from "@/db/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const templates = await prisma.campaignTemplate.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      project: { select: { name: true } },
      _count: { select: { generatedCampaigns: true } },
    },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <Link href="/campaigns/create" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
          + New Campaign
        </Link>
      </div>
      <div className="bg-white rounded-lg shadow">
        {!templates.length ? (
          <p className="p-6 text-gray-500">No campaign templates yet. Create one to start building campaigns from feeds.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Platform</th>
                <th className="px-4 py-3">Campaigns</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {templates.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/campaigns/${t.id}`} className="font-medium text-blue-600 hover:underline">{t.name}</Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{t.project.name}</td>
                  <td className="px-4 py-3">{t.campaignType}</td>
                  <td className="px-4 py-3">{t.platform}</td>
                  <td className="px-4 py-3">{t._count.generatedCampaigns}</td>
                  <td className="px-4 py-3">{t.active ? "Active" : "Inactive"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 flex gap-4">
        <Link href="/campaigns/templates" className="text-sm text-blue-600 hover:underline">Manage Templates</Link>
        <Link href="/campaigns/sync" className="text-sm text-blue-600 hover:underline">Sync Status</Link>
      </div>
    </div>
  );
}
