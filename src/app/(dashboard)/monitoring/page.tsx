import { db, T } from "@/db";
import type { Finding } from "@/db/types";
import { RunChecksButton } from "./run-checks-button";

export const dynamic = "force-dynamic";

export default async function MonitoringPage() {
  const { data } = await db.from(T.findings).select("*").order("created_at", { ascending: false }).limit(50);
  const findings = (data ?? []) as Finding[];

  const severityColors: Record<string, string> = {
    CRITICAL: "bg-red-100 text-red-800",
    HIGH: "bg-orange-100 text-orange-800",
    MEDIUM: "bg-yellow-100 text-yellow-800",
    LOW: "bg-blue-100 text-blue-800",
    INFO: "bg-gray-100 text-gray-800",
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Monitoring</h1>
        <RunChecksButton />
      </div>
      <div className="bg-white rounded-lg shadow">
        {!findings.length ? (
          <p className="p-6 text-gray-500">No findings yet. Click &quot;Run Checks&quot; to start monitoring.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Check</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {findings.map((f) => (
                <tr key={f.id}>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${severityColors[f.severity]}`}>{f.severity}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-600">{f.check_id}</td>
                  <td className="px-4 py-3">{f.title}</td>
                  <td className="px-4 py-3">{f.resolved_at ? "Resolved" : "Active"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
