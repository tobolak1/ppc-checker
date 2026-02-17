import { NextResponse } from "next/server";
import { runChecksForAllProjects } from "@/checks/runner";

export async function POST() {
  try {
    const result = await runChecksForAllProjects();
    return NextResponse.json({
      message: `Checked ${result.projectsChecked} projects, found ${result.totalFindings} issues`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Check run failed" },
      { status: 500 }
    );
  }
}
