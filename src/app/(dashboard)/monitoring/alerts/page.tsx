import { prisma } from "@/db/prisma";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const alerts = await prisma.alert.findMany({
    orderBy: { sentAt: "desc" },
    take: 100,
    include: {
      finding: { select: { checkId: true, severity: true, title: true } },
    },
  });

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-red-100 text-red-800",
    RESOLVED: "bg-green-100 text-green-800",
    MUTED: "bg-gray-100 text-gray-800",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Alert History</h1>
      <div className="bg-white rounded-lg shadow">
        {!alerts.length ? (
          <p className="p-6 text-gray-500">No alerts sent yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Check</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Sent</th>
                <th className="px-4 py-3">Resolved</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {alerts.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[a.status]}`}>{a.status}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-600">{a.finding.checkId}</td>
                  <td className="px-4 py-3">{a.finding.title}</td>
                  <td className="px-4 py-3 text-gray-500">{a.channel}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(a.sentAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-500">{a.resolvedAt ? new Date(a.resolvedAt).toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
