import { WorkflowAgent } from "@ai-sdk/workflow";
import { Sandbox } from "@vercel/sandbox";
import { z } from "zod";

import { type AnomalyResult, anomalySchema } from "./anomaly";
import { transactionsToCsv } from "./data";

export async function findAnomaliesSandboxWorkflow(): Promise<AnomalyResult> {
  "use workflow";

  const sandboxId = await createSandboxStep();

  try {
    const agent = new WorkflowAgent({
      model: "anthropic/claude-haiku-4.5",
      instructions: `You are a transaction anomaly detection agent. Analyze transaction data and identify anomalies.

The transaction data is in CSV format at ./workspace/transactions.csv with columns: id, date, name, description, amount

Use bash commands (awk, grep, sort, etc.) to analyze the data. Look for:
- Unusually large amounts (significantly higher than typical transactions)
- Duplicate transactions (same merchant, amount, and date)
- Suspicious merchant names (ALL CAPS, crypto-related, urgency language)
- Round number wire transfers
- Statistical outliers

After analysis, call the finalize tool with your findings.`,
      tools: {
        bash: {
          description:
            "Run a bash command in the sandbox. Returns stdout, stderr, exitCode.",
          inputSchema: z.object({ command: z.string() }),
          execute: ({ command }) => runBashStep(sandboxId, command),
        },
        finalize: {
          description:
            "Submit the final anomaly analysis. Calling this ends the run.",
          inputSchema: anomalySchema,
        },
      },
    });

    const result = await agent.stream({
      prompt: "Analyze ./workspace/transactions.csv for anomalies.",
      stopWhen: ({ steps }) =>
        steps.at(-1)?.toolCalls?.some((c) => c.toolName === "finalize") ??
        false,
    });

    const finalize = result.toolCalls.find((c) => c.toolName === "finalize");
    if (!finalize) {
      throw new Error("Workflow finished without calling finalize");
    }
    return parseAnomaliesStep(finalize.input);
  } finally {
    await stopSandboxStep(sandboxId);
  }
}

async function createSandboxStep(): Promise<string> {
  "use step";
  console.log("[workflow] createSandbox step");
  const sandbox = await Sandbox.create({ timeout: 60_000 });
  await sandbox.writeFiles([
    {
      path: "transactions.csv",
      content: Buffer.from(transactionsToCsv()),
    },
  ]);
  console.log(`[workflow] sandbox created: ${sandbox.sandboxId}`);
  return sandbox.sandboxId;
}

async function runBashStep(
  sandboxId: string,
  command: string,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  "use step";
  console.log(`[workflow] bash step: ${command}`);
  const sandbox = await Sandbox.get({ sandboxId });
  const result = await sandbox.runCommand("bash", ["-lc", command]);
  const [stdout, stderr] = await Promise.all([
    result.output("stdout"),
    result.output("stderr"),
  ]);
  return { stdout, stderr, exitCode: result.exitCode };
}

async function stopSandboxStep(sandboxId: string): Promise<void> {
  "use step";
  console.log(`[workflow] stopSandbox step: ${sandboxId}`);
  const sandbox = await Sandbox.get({ sandboxId });
  await sandbox.stop();
}

async function parseAnomaliesStep(input: unknown): Promise<AnomalyResult> {
  "use step";
  console.log("[workflow] parseAnomalies step");
  return anomalySchema.parse(input);
}
