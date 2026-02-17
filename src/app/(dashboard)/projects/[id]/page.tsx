import { db, T } from "@/db";
import type { Project, AdAccount, MerchantAccount, CheckRun } from "@/db/types";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: project } = await db
    .from(T.projects)
    .select("*")
    .eq("id", id)
    .single<Project>();

  if (!project) notFound();

  const [adRes, merchantRes, checkRes] = await Promise.all([
    db.from(T.adAccounts).select("*").eq("project_id", id),
    db.from(T.merchantAccounts).select("*").eq("project_id", id),
    db.from(T.checkRuns).select("*").eq("project_id", id).order("started_at", { ascending: false }).limit(5),
  ]);

  const adAccounts = (adRes.data ?? []) as AdAccount[];
  const merchantAccounts = (merchantRes.data ?? []) as MerchantAccount[];
  const checkRuns = (checkRes.data ?? []) as CheckRun[];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">{project.name}</h1>
      {project.description && <p className="text-gray-500 mb-6">{project.description}</p>}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <h2 className="font-semibold p-4 border-b">Ad Accounts ({adAccounts.length})</h2>
          {!adAccounts.length ? (
            <p className="p-4 text-sm text-gray-500">No ad accounts connected.</p>
          ) : (
            <ul className="divide-y">
              {adAccounts.map((a) => (
                <li key={a.id} className="p-4 flex justify-between text-sm">
                  <span>{a.name}</span><span className="text-gray-400">{a.platform}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-white rounded-lg shadow">
          <h2 className="font-semibold p-4 border-b">Merchant Accounts ({merchantAccounts.length})</h2>
          {!merchantAccounts.length ? (
            <p className="p-4 text-sm text-gray-500">No merchant accounts connected.</p>
          ) : (
            <ul className="divide-y">
              {merchantAccounts.map((m) => (
                <li key={m.id} className="p-4 text-sm">{m.name}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-white rounded-lg shadow md:col-span-2">
          <h2 className="font-semibold p-4 border-b">Recent Check Runs</h2>
          {!checkRuns.length ? (
            <p className="p-4 text-sm text-gray-500">No checks run yet.</p>
          ) : (
            <ul className="divide-y">
              {checkRuns.map((c) => (
                <li key={c.id} className="p-4 flex justify-between text-sm">
                  <span>{new Date(c.started_at).toLocaleString()}</span>
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
