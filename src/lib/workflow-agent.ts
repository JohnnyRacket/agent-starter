import { Output, WorkflowAgent } from "@ai-sdk/workflow";
import { z } from "zod";

import { type AnomalyResult, anomalySchema } from "./anomaly";
import { transactions } from "./data";
import { findAnomaliesWithSandbox } from "./sandbox-agent";

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
        description:
          "Fetch all financial transactions from the database. Call this tool first to get transaction data before analyzing for anomalies.",
        inputSchema: z.object({}),
        execute: async () => {
          "use step";
          return transactions;
        },
      },
    },
  });

  const result = await agent.stream({
    prompt:
      "Retrieve the transactions and analyze them for anomalies, then call finalize with your findings.",
    output: Output.object({ schema: anomalySchema }),
  });

  return result.output;
}

async function runSandboxAnalysisStep(): Promise<AnomalyResult> {
  "use step";
  return findAnomaliesWithSandbox();
}

export async function findAnomaliesSandboxWorkflow(): Promise<AnomalyResult> {
  "use workflow";
  return runSandboxAnalysisStep();
}
