import { NextResponse } from "next/server";
import supabase from "@/lib/supabase";
import { runAllChecks } from "@/checks/runner";

export async function POST() {
  // Get all projects
  const { data: projects } = await supabase.from("ppc_projects").select("id, name");
  if (!projects?.length) {
    return NextResponse.json({ message: "No projects to check" });
  }

  let totalFindings = 0;

  for (const project of projects) {
    // Create check run
    const { data: checkRun } = await supabase
      .from("ppc_check_runs")
      .insert({ project_id: project.id })
      .select("id")
      .single();

    if (!checkRun) continue;

    // Run all checks for this project
    const findings = await runAllChecks(project.id);
    totalFindings += findings.length;

    // Insert findings
    if (findings.length > 0) {
      await supabase.from("ppc_findings").insert(
        findings.map((f) => ({ ...f, check_run_id: checkRun.id }))
      );
    }

    // Complete check run
    await supabase
      .from("ppc_check_runs")
      .update({ status: "completed", ended_at: new Date().toISOString() })
      .eq("id", checkRun.id);
  }

  return NextResponse.json({
    message: `Checked ${projects.length} projects, found ${totalFindings} issues`,
  });
}
