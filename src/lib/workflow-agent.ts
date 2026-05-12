import { WorkflowAgent } from "@ai-sdk/workflow";
import { z } from "zod";

import { type AnomalyResult, anomalySchema } from "./anomaly";
import { transactions } from "./data";

export async function findAnomaliesWorkflow(): Promise<AnomalyResult> {
  "use workflow";

  const agent = new WorkflowAgent({
    model: "anthropic/claude-haiku-4.5",
    instructions: `You are a transaction anomaly detection agent. Analyze transaction data and identify anomalies.

Use the getTransactions tool to retrieve transaction data, then analyze it for anomalies.

Look for:
- Unusually large amounts (significantly higher than typical transactions)
- Duplicate transactions (same merchant, amount, and date)
- Suspicious merchant names (ALL CAPS, crypto-related, urgency language)
- Round number wire transfers
- Statistical outliers

After analysis, call the finalize tool with your findings.`,
    tools: {
      getTransactions: {
        description: "Fetch all financial transactions from the database.",
        inputSchema: z.object({}),
        execute: getTransactionsStep,
      },
      finalize: {
        description:
          "Submit the final anomaly analysis. Calling this ends the run.",
        inputSchema: anomalySchema,
      },
    },
  });

  const result = await agent.stream({
    prompt: "Retrieve the transactions and analyze them for anomalies.",
    stopWhen: ({ steps }) =>
      steps.at(-1)?.toolCalls?.some((c) => c.toolName === "finalize") ?? false,
  });

  const finalize = result.toolCalls.find((c) => c.toolName === "finalize");
  if (!finalize) {
    throw new Error("Workflow finished without calling finalize");
  }
  return parseAnomaliesStep(finalize.input);
}

async function getTransactionsStep() {
  "use step";
  console.log("[workflow] getTransactions step");
  return transactions;
}

async function parseAnomaliesStep(input: unknown): Promise<AnomalyResult> {
  "use step";
  console.log("[workflow] parseAnomalies step");
  return anomalySchema.parse(input);
}
