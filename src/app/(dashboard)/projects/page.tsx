import { prisma } from "@/db/prisma";
import Link from "next/link";
import { CreateProjectForm } from "./create-form";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { adAccounts: true } },
      checkRuns: {
        orderBy: { startedAt: "desc" },
        take: 1,
        select: { startedAt: true },
      },
    },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
      </div>
      <CreateProjectForm />
      <div className="grid gap-4 mt-6">
        {!projects.length ? (
          <p className="text-gray-500">No projects yet. Create your first project above.</p>
        ) : (
          projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-semibold text-lg">{p.name}</h2>
                  {p.description && <p className="text-sm text-gray-500 mt-1">{p.description}</p>}
                </div>
                <div className="text-right text-sm text-gray-400">
                  <p>{p._count.adAccounts} account{p._count.adAccounts !== 1 ? "s" : ""}</p>
                  {p.checkRuns[0] && (
                    <p>Last check: {new Date(p.checkRuns[0].startedAt).toLocaleDateString()}</p>
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
