import supabase from "@/lib/supabase";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [{ data: project }, { data: accounts }, { data: merchants }, { data: checkRuns }] = await Promise.all([
    supabase.from("ppc_projects").select("*").eq("id", id).single(),
    supabase.from("ppc_ad_accounts").select("*").eq("project_id", id),
    supabase.from("ppc_merchant_accounts").select("*").eq("project_id", id),
    supabase.from("ppc_check_runs").select("*").eq("project_id", id).order("started_at", { ascending: false }).limit(5),
  ]);

  if (!project) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">{project.name}</h1>
      {project.description && <p className="text-gray-500 mb-6">{project.description}</p>}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <h2 className="font-semibold p-4 border-b">Ad Accounts ({accounts?.length || 0})</h2>
          {!accounts?.length ? (
            <p className="p-4 text-sm text-gray-500">No ad accounts connected.</p>
          ) : (
            <ul className="divide-y">
              {accounts.map((a: Record<string, string>) => (
                <li key={a.id} className="p-4 flex justify-between text-sm">
                  <span>{a.name}</span><span className="text-gray-400">{a.platform}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-white rounded-lg shadow">
          <h2 className="font-semibold p-4 border-b">Merchant Accounts ({merchants?.length || 0})</h2>
          {!merchants?.length ? (
            <p className="p-4 text-sm text-gray-500">No merchant accounts connected.</p>
          ) : (
            <ul className="divide-y">
              {merchants.map((m: Record<string, string>) => (
                <li key={m.id} className="p-4 text-sm">{m.name}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-white rounded-lg shadow md:col-span-2">
          <h2 className="font-semibold p-4 border-b">Recent Check Runs</h2>
          {!checkRuns?.length ? (
            <p className="p-4 text-sm text-gray-500">No checks run yet.</p>
          ) : (
            <ul className="divide-y">
              {checkRuns.map((c: Record<string, string>) => (
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
