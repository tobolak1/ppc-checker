import { prisma } from "@/db/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      adAccounts: true,
      merchantAccounts: true,
      checkRuns: {
        orderBy: { startedAt: "desc" },
        take: 5,
      },
    },
  });

  if (!project) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">{project.name}</h1>
      {project.description && <p className="text-gray-500 mb-6">{project.description}</p>}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <h2 className="font-semibold p-4 border-b">Ad Accounts ({project.adAccounts.length})</h2>
          {!project.adAccounts.length ? (
            <p className="p-4 text-sm text-gray-500">No ad accounts connected.</p>
          ) : (
            <ul className="divide-y">
              {project.adAccounts.map((a) => (
                <li key={a.id} className="p-4 flex justify-between text-sm">
                  <span>{a.name}</span><span className="text-gray-400">{a.platform}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-white rounded-lg shadow">
          <h2 className="font-semibold p-4 border-b">Merchant Accounts ({project.merchantAccounts.length})</h2>
          {!project.merchantAccounts.length ? (
            <p className="p-4 text-sm text-gray-500">No merchant accounts connected.</p>
          ) : (
            <ul className="divide-y">
              {project.merchantAccounts.map((m) => (
                <li key={m.id} className="p-4 text-sm">{m.name}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-white rounded-lg shadow md:col-span-2">
          <h2 className="font-semibold p-4 border-b">Recent Check Runs</h2>
          {!project.checkRuns.length ? (
            <p className="p-4 text-sm text-gray-500">No checks run yet.</p>
          ) : (
            <ul className="divide-y">
              {project.checkRuns.map((c) => (
                <li key={c.id} className="p-4 flex justify-between text-sm">
                  <span>{new Date(c.startedAt).toLocaleString()}</span>
                  <span className="text-gray-400">{c.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
