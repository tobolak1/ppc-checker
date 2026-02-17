import { prisma } from "@/db/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [accountCount, findings, campaignCount] = await Promise.all([
    prisma.adAccount.count(),
    prisma.finding.findMany({
      where: { resolvedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.generatedCampaign.count(),
  ]);

  const severityColors: Record<string, string> = {
    CRITICAL: "bg-red-100 text-red-800",
    HIGH: "bg-orange-100 text-orange-800",
    MEDIUM: "bg-yellow-100 text-yellow-800",
    LOW: "bg-blue-100 text-blue-800",
    INFO: "bg-gray-100 text-gray-800",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Ad Accounts</p>
          <p className="text-2xl font-bold">{accountCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Active Findings</p>
          <p className="text-2xl font-bold text-red-600">{findings.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Campaigns</p>
          <p className="text-2xl font-bold">{campaignCount}</p>
        </div>
        <Link href="/monitoring" className="bg-blue-600 text-white rounded-lg shadow p-4 hover:bg-blue-700">
          <p className="text-sm opacity-80">Quick Action</p>
          <p className="text-lg font-bold">Run Check</p>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex justify-between">
          <h2 className="font-semibold">Recent Findings</h2>
          <Link href="/monitoring" className="text-sm text-blue-600 hover:underline">View all</Link>
        </div>
        {!findings.length ? (
          <p className="p-4 text-sm text-gray-500">No active findings.</p>
        ) : (
          <ul className="divide-y">
            {findings.map((f) => (
              <li key={f.id} className="p-4 flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${severityColors[f.severity]}`}>{f.severity}</span>
                <span className="text-sm font-mono text-gray-600">{f.checkId}</span>
                <span className="text-sm flex-1">{f.title}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
