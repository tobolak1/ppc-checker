import { db, T } from "@/db";
import type { Project, AdAccount, CheckRun } from "@/db/types";
import Link from "next/link";
import { CreateProjectForm } from "./create-form";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const { data: projects } = await db
    .from(T.projects)
    .select("*")
    .order("created_at", { ascending: false });

  const projectList = (projects ?? []) as Project[];

  // Fetch counts and last check for each project
  const enriched = await Promise.all(
    projectList.map(async (p) => {
      const [accountRes, checkRes] = await Promise.all([
        db.from(T.adAccounts).select("id", { count: "exact", head: true }).eq("project_id", p.id),
        db.from(T.checkRuns).select("started_at").eq("project_id", p.id).order("started_at", { ascending: false }).limit(1),
      ]);
      return {
        ...p,
        accountCount: accountRes.count ?? 0,
        lastCheck: (checkRes.data?.[0] as CheckRun | undefined)?.started_at ?? null,
      };
    })
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
      </div>
      <CreateProjectForm />
      <div className="grid gap-4 mt-6">
        {!enriched.length ? (
          <p className="text-gray-500">No projects yet. Create your first project above.</p>
        ) : (
          enriched.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-semibold text-lg">{p.name}</h2>
                  {p.description && <p className="text-sm text-gray-500 mt-1">{p.description}</p>}
                </div>
                <div className="text-right text-sm text-gray-400">
                  <p>{p.accountCount} account{p.accountCount !== 1 ? "s" : ""}</p>
                  {p.lastCheck && (
                    <p>Last check: {new Date(p.lastCheck).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
