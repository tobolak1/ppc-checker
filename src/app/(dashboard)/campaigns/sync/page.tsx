import { prisma } from "@/db/prisma";

export const dynamic = "force-dynamic";

export default async function SyncPage() {
  const logs = await prisma.syncLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      generatedCampaign: { select: { name: true } },
    },
  });

  const actionColors: Record<string, string> = {
    CREATED: "bg-green-100 text-green-800",
    UPDATED: "bg-blue-100 text-blue-800",
    PAUSED: "bg-yellow-100 text-yellow-800",
    RESUMED: "bg-teal-100 text-teal-800",
    REMOVED: "bg-red-100 text-red-800",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Feed Sync Log</h1>
      <div className="bg-white rounded-lg shadow">
        {!logs.length ? (
          <p className="p-6 text-gray-500">No sync activity yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${actionColors[log.action]}`}>{log.action}</span>
                  </td>
                  <td className="px-4 py-3">{log.generatedCampaign.name}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
