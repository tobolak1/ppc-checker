import { db, T } from "@/db";
import type { Project } from "@/db/types";
import { CampaignWizard } from "./wizard";

export const dynamic = "force-dynamic";

export default async function CreateCampaignPage() {
  const { data } = await db
    .from(T.projects)
    .select("id, name")
    .order("name", { ascending: true });

  const projects = (data ?? []) as Pick<Project, "id" | "name">[];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Create Campaign</h1>
      {!projects.length ? (
        <p className="text-gray-500">Create a project first before building campaigns.</p>
      ) : (
        <CampaignWizard projects={projects} />
      )}
    </div>
  );
}
