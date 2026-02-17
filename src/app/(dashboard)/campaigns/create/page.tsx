import { prisma } from "@/db/prisma";
import { CampaignWizard } from "./wizard";

export const dynamic = "force-dynamic";

export default async function CreateCampaignPage() {
  const projects = await prisma.project.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

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
