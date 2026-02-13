import supabase from "@/lib/supabase";
import Link from "next/link";
import { CreateProjectForm } from "./create-form";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const { data: projects } = await supabase
    .from("ppc_projects")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
      </div>
      <CreateProjectForm />
      <div className="grid gap-4 mt-6">
        {!projects?.length ? (
          <p className="text-gray-500">No projects yet. Create your first project above.</p>
        ) : (
          projects.map((p: Record<string, string>) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
              <h2 className="font-semibold text-lg">{p.name}</h2>
              {p.description && <p className="text-sm text-gray-500 mt-1">{p.description}</p>}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
