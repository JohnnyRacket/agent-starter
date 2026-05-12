import { start } from "workflow/api";

import { findAnomaliesSandboxWorkflow } from "@/lib/workflow-agent";

export const maxDuration = 60;

export async function POST() {
  try {
    const run = await start(findAnomaliesSandboxWorkflow);
    const result = await run.returnValue;
    return Response.json(result);
  } catch (error) {
    console.error("Workflow sandbox detection failed:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
